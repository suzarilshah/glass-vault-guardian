
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

    console.log(`Checking password breach for length: ${password.length}`);

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

    console.log(`Password check result: ${isBreached ? 'BREACHED' : 'SAFE'}`);

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
  
  // Parse the storage URL - it should be a complete SAS URL
  const url = new URL(storageUrl);
  
  // Check if this is already a complete SAS URL with container
  let baseUrl, containerName, sasParams;
  
  if (url.pathname && url.pathname !== '/') {
    // URL already includes container path
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    baseUrl = `${url.protocol}//${url.hostname}`;
    containerName = pathParts[0];
    sasParams = url.search;
  } else {
    // URL is just the storage account, use default container
    baseUrl = storageUrl.replace(/\/$/, ''); // Remove trailing slash
    containerName = 'pws';
    sasParams = '';
  }

  console.log(`Using container: ${containerName}`);
  console.log(`Base URL: ${baseUrl}`);

  // Step 1: List blobs to find rockyou2024.zip
  console.log('Listing blobs in container...');
  
  // Construct the list URL properly
  let listUrl;
  if (sasParams) {
    // If we have SAS params, use them with proper separator
    const separator = sasParams.startsWith('?') ? '&' : '?';
    listUrl = `${baseUrl}/${containerName}${separator}restype=container&comp=list${sasParams.startsWith('?') ? sasParams.substring(1) : sasParams}`;
  } else {
    listUrl = `${baseUrl}/${containerName}?restype=container&comp=list`;
  }
  
  console.log(`List URL: ${listUrl.replace(/([?&])(sig|st|se|spr|sp|sv)=[^&]*/g, '$1$2=***')}`); // Log URL with masked sensitive params
  
  const listResponse = await fetch(listUrl);
  if (!listResponse.ok) {
    console.error(`Failed to list blobs. Status: ${listResponse.status}`);
    const responseText = await listResponse.text();
    console.error(`Response text: ${responseText}`);
    throw new Error(`Failed to list blobs: ${listResponse.status}`);
  }

  const xmlText = await listResponse.text();
  console.log('Blob listing received, parsing...');

  // Find rockyou2024.zip blob
  const nameMatch = xmlText.match(/<Name>([^<]*rockyou2024[^<]*\.zip)<\/Name>/i);
  if (!nameMatch) {
    console.error('Available blobs:');
    const allNames = xmlText.match(/<Name>([^<]+)<\/Name>/g);
    if (allNames) {
      allNames.forEach(name => console.log(`  - ${name.replace(/<\/?Name>/g, '')}`));
    }
    throw new Error('rockyou2024.zip file not found in Azure container');
  }

  const zipFileName = nameMatch[1];
  console.log(`Found zip file: ${zipFileName}`);

  // Step 2: Download the zip file
  let zipUrl;
  if (sasParams) {
    zipUrl = `${baseUrl}/${containerName}/${zipFileName}${sasParams}`;
  } else {
    zipUrl = `${baseUrl}/${containerName}/${zipFileName}`;
  }
  
  console.log(`Downloading zip file...`);
  
  const zipResponse = await fetch(zipUrl);
  if (!zipResponse.ok) {
    console.error(`Failed to download zip file. Status: ${zipResponse.status}`);
    throw new Error(`Failed to download zip file: ${zipResponse.status}`);
  }

  const zipArrayBuffer = await zipResponse.arrayBuffer();
  console.log(`Downloaded ${zipArrayBuffer.byteLength} bytes`);

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
      throw new Error('Invalid ZIP file: EOCD not found');
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
        
        let fileData: Uint8Array;
        const dataStart = localHeaderOffset + localHeaderSize;
        
        if (compressionMethod === 0) {
          // No compression
          fileData = zipData.slice(dataStart, dataStart + compressedSize);
        } else {
          // Handle compression (basic deflate)
          const compressedData = zipData.slice(dataStart, dataStart + compressedSize);
          fileData = await decompressData(compressedData);
        }
        
        // Convert to text and split into lines
        const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
        const text = decoder.decode(fileData);
        const lines = text.split('\n');
        
        console.log(`Processing ${lines.length} passwords...`);
        
        for (const line of lines) {
          const password = line.trim();
          if (password && password.length > 0) {
            passwordSet.add(password.toLowerCase());
          }
        }
        
        break; // Process only the first file
      }
      
      currentOffset += 46; // Move to next central directory entry
    }
    
  } catch (error) {
    console.error('Error parsing ZIP file:', error);
    throw new Error(`Failed to extract passwords from ZIP: ${error.message}`);
  }

  console.log(`Loaded ${passwordSet.size} unique passwords from rockyou2024.zip`);
  return passwordSet;
}

async function decompressData(compressedData: Uint8Array): Promise<Uint8Array> {
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
}
