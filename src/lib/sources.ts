// Simple ITK sources - just the 15 accounts we care about
export const ITK_SOURCES = [
  { name: "Fabrizio Romano", handle: "@FabrizioRomano" },
  { name: "David Ornstein", handle: "@David_Ornstein" },
  { name: "Sam Lee", handle: "@SamLee" },
  { name: "Paul Joyce", handle: "@_pauljoyce" },
  { name: "Laurie Whitwell", handle: "@lauriewhitwell" },
  { name: "Rob Dawson", handle: "@RobDawsonESPN" },
  { name: "Luke Edwards", handle: "@LukeEdwardsTele" },
  { name: "John Percy", handle: "@JPercyTelegraph" },
  { name: "Craig Hope", handle: "@CraigHope_DM" },
  { name: "Dean Jones", handle: "@DeanJonesSoccer" },
  { name: "Sirayah Shiraz", handle: "@SirayahShiraz" },
  { name: "Mohamed Bouhafsi", handle: "@BouhafsiMohamed" },
  { name: "Gianluca Di Marzio", handle: "@DiMarzio" },
  { name: "Alfredo Pedulla", handle: "@alfredopedulla" },
  { name: "Raphael Honigstein", handle: "@honigstein" },
] as const;

export type ITKSource = (typeof ITK_SOURCES)[number];
