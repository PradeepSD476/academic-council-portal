import {
  FileText,
  BookOpen,
  ClipboardList,
  Presentation,
  Video,
  Code,
  Database,
  ScrollText,
  Layers,
  Calendar,
  HelpCircle
} from "lucide-react";

export const RESOURCE_TYPES = [
  { key: "NOTES", label: "Lecture Notes", icon: FileText, color: "blue" },
  { key: "PYQ", label: "Previous Year Questions", icon: FileText, color: "blue" },
  { key: "TUTORIAL", label: "Tutorials", icon: FileText, color: "blue" },
  { key: "ASSIGNMENT", label: "Assignments", icon: FileText, color: "blue" },
  { key: "LECTURE_SLIDE", label: "Lecture Slides", icon: FileText, color: "blue" },
  { key: "BOOK", label: "Reference Books", icon: FileText, color: "blue" },
  { key: "LAB_MANUAL", label: "Lab Manual", icon: FileText, color: "blue" },
  { key: "LAB_ASSIGNMENT", label: "Lab Assignments", icon: FileText, color: "blue" },
  { key: "PROJECT", label: "Project Guidelines", icon: FileText, color: "blue" },
  { key: "SYLLABUS", label: "Syllabus", icon: FileText, color: "blue" },
  { key: "QUESTION_BANK", label: "Question Bank", icon: FileText, color: "blue" },
  { key: "VIDEO_LECTURE", label: "Video Lectures", icon: FileText, color: "blue" },
  { key: "TIME_TABLE", label: "Time Table", icon: FileText, color: "blue" },
  { key: "OTHER", label: "Other Resources", icon: FileText, color: "blue" }
];

export const getResourceLabel = (key) =>
  RESOURCE_TYPES[key]?.label || key;