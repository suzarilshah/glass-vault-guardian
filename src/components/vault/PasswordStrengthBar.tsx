
import React from "react";
import { calculatePasswordScore } from "@/utils/passwordScoring";

interface PasswordStrengthBarProps {
  password: string;
}

const strengthLevels = [
  { label: "Worse", min: 0, max: 25, color: "bg-red-500", textColor: "text-red-400" },
  { label: "Bad", min: 26, max: 50, color: "bg-orange-500", textColor: "text-orange-400" },
  { label: "Fair", min: 51, max: 80, color: "bg-yellow-500", textColor: "text-yellow-400" },
  { label: "Strong", min: 81, max: 100, color: "bg-green-500", textColor: "text-green-400" },
];

function getStrengthBarInfo(score: number) {
  return strengthLevels.find(level => score >= level.min && score <= level.max) || strengthLevels[0];
}

const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password }) => {
  if (!password) return null;

  const { totalScore } = calculatePasswordScore(password);
  const barInfo = getStrengthBarInfo(totalScore);

  return (
    <div className="mt-2 mb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-300 font-medium">Password Strength</span>
        <span className={`text-xs font-semibold uppercase ${barInfo.textColor}`}>
          {barInfo.label} ({totalScore}%)
        </span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
        <div
          className={`h-full transition-all duration-400 ${barInfo.color}`}
          style={{
            width: `${totalScore}%`,
            minWidth: totalScore > 0 ? "5%" : "0%",
          }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthBar;
