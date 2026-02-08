
export const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const topics = [
  "HTML/CSS", "JavaScript", "Python", "React", "Django", "Node.js", "Rust", 
  "Digital Marketing", "Web3", "Cryptocurrency", "Cybersecurity", "NFTs", "SQL", 
  "Artificial Intelligence", "Web Design", "Programming Fundamentals",
  "Other"
];

export const timezones = [
  "Etc/GMT+12", "Etc/GMT+11", "Pacific/Honolulu", "America/Anchorage",
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Sao_Paulo", "Etc/GMT+2", "Europe/London", "Europe/Berlin",
  "Europe/Moscow", "Etc/GMT-3", "Asia/Dubai", "Asia/Karachi", "Asia/Dhaka",
  "Asia/Bangkok", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland"
].map(tz => ({ value: tz, label: tz.replace(/_/g, ' ').split('/').pop() || tz }));
