
import { corsHeaders } from '../_shared/cors.ts';

interface PasswordCheckRequest {
  password: string;
}

interface PasswordCheckResponse {
  isBreached: boolean;
  message: string;
}

// In-memory cache for performance
let passwordCache: Set<string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password }: PasswordCheckRequest = await req.json();
    
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ 
          isBreached: false, 
          message: 'Invalid password provided' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check cache first or load if expired
    const now = Date.now();
    if (!passwordCache || (now - cacheTimestamp) > CACHE_TTL) {
      console.log('Loading password database from Azure...');
      passwordCache = await loadPasswordDatabase();
      cacheTimestamp = now;
      console.log(`Password database loaded with ${passwordCache.size} entries`);
    }

    // Check if password exists in breach database
    const isBreached = passwordCache.has(password.toLowerCase());
    
    const response: PasswordCheckResponse = {
      isBreached,
      message: isBreached 
        ? 'Password found in breach database'
        : 'Password not found in breach database'
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in password breach check:', error);
    
    return new Response(
      JSON.stringify({ 
        isBreached: false, 
        message: 'Error checking password breach status',
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function loadPasswordDatabase(): Promise<Set<string>> {
  const storageUrl = Deno.env.get('AZURE_STORAGE_ACCOUNT_URL');
  
  if (!storageUrl) {
    throw new Error('Azure Storage URL not configured');
  }

  console.log('Parsing Azure Storage URL...');
  
  // Parse the complete SAS URL
  const url = new URL(storageUrl);
  const baseUrl = `${url.protocol}//${url.hostname}`;
  const sasQuery = url.search; // This includes the leading '?'
  const containerName = 'pws';
  
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Container: ${containerName}`);
  console.log(`SAS query length: ${sasQuery.length}`);

  if (!sasQuery || sasQuery.length < 10) {
    throw new Error('Invalid SAS token in Azure Storage URL');
  }

  // Step 1: List blobs to find rockyou2024.zip
  console.log('Listing blobs in container...');
  
  // Construct the list URL: baseUrl/container?restype=container&comp=list&sasParams
  // We need to combine the SAS parameters with the list parameters
  const listParams = new URLSearchParams();
  listParams.set('restype', 'container');
  listParams.set('comp', 'list');
  
  // Parse existing SAS parameters and add them
  const sasParams = new URLSearchParams(sasQuery.substring(1)); // Remove leading '?'
  for (const [key, value] of sasParams) {
    listParams.set(key, value);
  }
  
  const listUrl = `${baseUrl}/${containerName}?${listParams.toString()}`;
  
  console.log('Constructed list URL with all parameters');
  
  const listResponse = await fetch(listUrl);
  if (!listResponse.ok) {
    console.error(`Failed to list blobs. Status: ${listResponse.status}`);
    const responseText = await listResponse.text();
    console.error(`Response text: ${responseText}`);
    throw new Error(`Failed to list blobs: ${listResponse.status} - ${listResponse.statusText}`);
  }

  const xmlText = await listResponse.text();
  console.log('Blob listing received, parsing XML...');

  // Find rockyou2024.zip blob
  const nameMatch = xmlText.match(/<Name>([^<]*rockyou2024[^<]*\.zip)<\/Name>/i);
  if (!nameMatch) {
    console.error('Available blobs:');
    const allNames = xmlText.match(/<Name>([^<]+)<\/Name>/g);
    if (allNames) {
      allNames.slice(0, 10).forEach(name => console.log(`  - ${name.replace(/<\/?Name>/g, '')}`));
      if (allNames.length > 10) {
        console.log(`  ... and ${allNames.length - 10} more files`);
      }
    } else {
      console.log('  No files found in container');
    }
    throw new Error('rockyou2024.zip file not found in Azure container');
  }

  const zipFileName = nameMatch[1];
  console.log(`Found zip file: ${zipFileName}`);

  // Step 2: Download the zip file
  // For download, we use the original SAS query string as-is
  const zipUrl = `${baseUrl}/${containerName}/${zipFileName}${sasQuery}`;
  
  console.log(`Downloading zip file from Azure...`);
  
  const zipResponse = await fetch(zipUrl);
  if (!zipResponse.ok) {
    console.error(`Failed to download zip file. Status: ${zipResponse.status}`);
    const responseText = await zipResponse.text();
    console.error(`Download error response: ${responseText.substring(0, 200)}`);
    throw new Error(`Failed to download zip file: ${zipResponse.status} - ${zipResponse.statusText}`);
  }

  const zipArrayBuffer = await zipResponse.arrayBuffer();
  console.log(`Downloaded ${zipArrayBuffer.byteLength} bytes successfully`);

  // Step 3: Extract and parse the zip file
  const passwordSet = new Set<string>();
  
  try {
    // Simple ZIP parsing for a single text file
    const zipData = new Uint8Array(zipArrayBuffer);
    
    // Find the central directory end record
    let eocdOffset = -1;
    for (let i = zipData.length - 22; i >= 0; i--) {
      if (zipData[i] === 0x50 && zipData[i + 1] === 0x4b && 
          zipData[i + 2] === 0x05 && zipData[i + 3] === 0x06) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) {
      throw new Error('Invalid ZIP file: End of Central Directory record not found');
    }

    // Read central directory offset
    const centralDirOffset = new DataView(zipData.buffer).getUint32(eocdOffset + 16, true);
    
    // Find the local file header
    let currentOffset = centralDirOffset;
    while (currentOffset < zipData.length - 4) {
      const signature = new DataView(zipData.buffer).getUint32(currentOffset, true);
      
      if (signature === 0x02014b50) { // Central directory file header
        const filenameLength = new DataView(zipData.buffer).getUint16(currentOffset + 28, true);
        const localHeaderOffset = new DataView(zipData.buffer).getUint32(currentOffset + 42, true);
        
        // Get the actual file data
        const localHeaderSize = 30 + filenameLength;
        const compressedSize = new DataView(zipData.buffer).getUint32(currentOffset + 20, true);
        const compressionMethod = new DataView(zipData.buffer).getUint16(currentOffset + 10, true);
        
        console.log(`Processing file with compression method: ${compressionMethod}, size: ${compressedSize}`);
        
        let fileData: Uint8Array;
        const dataStart = localHeaderOffset + localHeaderSize;
        
        if (compressionMethod === 0) {
          // No compression
          fileData = zipData.slice(dataStart, dataStart + compressedSize);
          console.log('File is uncompressed');
        } else {
          // Handle compression (basic deflate)
          console.log('Decompressing file data...');
          const compressedData = zipData.slice(dataStart, dataStart + compressedSize);
          fileData = await decompressData(compressedData);
          console.log(`Decompressed to ${fileData.length} bytes`);
        }
        
        // Convert to text and split into lines
        const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
        const text = decoder.decode(fileData);
        const lines = text.split('\n');
        
        console.log(`Processing ${lines.length} passwords from rockyou2024.zip...`);
        
        let processedCount = 0;
        for (const line of lines) {
          const password = line.trim();
          if (password && password.length > 0) {
            passwordSet.add(password.toLowerCase());
            processedCount++;
          }
        }
        
        console.log(`Successfully processed ${processedCount} passwords`);
        break; // Process only the first file
      }
      
      currentOffset += 46; // Move to next central directory entry
    }
    
  } catch (error) {
    console.error('Error parsing ZIP file:', error);
    throw new Error(`Failed to extract passwords from ZIP: ${error.message}`);
  }

  console.log(`Successfully loaded ${passwordSet.size} unique passwords from rockyou2024.zip`);
  return passwordSet;
}

async function decompressData(compressedData: Uint8Array): Promise<Uint8Array> {
  try {
    // Use the built-in compression API
    const stream = new DecompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    // Write compressed data
    await writer.write(compressedData);
    await writer.close();
    
    // Read decompressed data
    const chunks: Uint8Array[] = [];
    let result = await reader.read();
    
    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }
    
    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const decompressed = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }
    
    return decompressed;
  } catch (error) {
    console.error('Decompression failed:', error);
    throw new Error(`Failed to decompress data: ${error.message}`);
  }
}
