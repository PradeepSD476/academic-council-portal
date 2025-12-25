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
  { key: "PYQ", label: "Previous Year Questions", icon: ScrollText, color: "green" },
  { key: "TUTORIAL", label: "Tutorials", icon: HelpCircle, color: "purple" },
  { key: "ASSIGNMENT", label: "Assignments", icon: ClipboardList, color: "orange" },
  { key: "LECTURE_SLIDE", label: "Lecture Slides", icon: Presentation, color: "indigo" },
  { key: "BOOK", label: "Reference Books", icon: BookOpen, color: "pink" },
  { key: "LAB_MANUAL", label: "Lab Manual", icon: Layers, color: "amber" },
  { key: "LAB_ASSIGNMENT", label: "Lab Assignments", icon: ClipboardList, color: "yellow" },
  { key: "PROJECT", label: "Project Guidelines", icon: Code, color: "cyan" },
  { key: "SYLLABUS", label: "Syllabus", icon: FileText, color: "red" },
  { key: "QUESTION_BANK", label: "Question Bank", icon: Database, color: "teal" },
  { key: "VIDEO_LECTURE", label: "Video Lectures", icon: Video, color: "violet" },
  { key: "TIME_TABLE", label: "Time Table", icon: Calendar, color: "slate" },
  { key: "OTHER", label: "Other Resources", icon: HelpCircle, color: "gray" }
];

export const getResourceLabel = (key) =>
  RESOURCE_TYPES[key]?.label || key;