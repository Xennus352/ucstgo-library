import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import Image from "next/image";

interface DeleteBookDialogProps {
  book: {
    id: string;
    title: string;
    coverImage?: string | null;
    author?: { name: string } | null;
    isbn?: string | null;
    category?: { name: string } | null;
    availability?: { available: number; total: number } | null;
  };
  onDelete?: (id: string) => void;
  isMobile?: boolean;
}

export function DeleteBookDialog({
  book,
  onDelete,
  isMobile = false,
}: DeleteBookDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            ${
              isMobile
                ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs h-8 px-2.5"
                : "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            }
          `}
        >
          <Trash2
            className={isMobile ? "w-3.5 h-3.5 mr-1" : "w-4 h-4 mr-1.5"}
          />
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent
        className="
          w-[92vw]
          sm:max-w-135!
          md:max-w-155!
          p-0 border-0 shadow-2xl
          rounded-xl
          bg-white/95 backdrop-blur-sm
          overflow-hidden
          mx-auto
        "
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-linear-to-r from-red-600 to-rose-600" />

        <div className="p-5 sm:p-6 md:p-8 pt-5">
          <AlertDialogHeader className="space-y-4 text-left min-w-0">
            {/* 
              FIX 2: Forced layout breaking behavior. Changed 'sm:flex-row' to 'md:flex-row' 
              to provide adequate padding for the desktop columns.
            */}
            <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start min-w-0">
              {/* Left Side Column: Icon + Cover Photo Stack */}
              <div className="flex flex-row md:flex-col gap-4 items-center md:items-center shrink-0 w-full md:w-auto">
                {/* Trash Icon */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" />
                </div>

                {/* Cover Photo - SAFE DESKTOP VISUALS */}
                <div
                  className="
                    w-24 h-32 
                    sm:w-28 sm:h-40 
                    md:w-36 md:h-48
                    rounded-lg 
                    border-2 border-slate-200 dark:border-slate-700 
                    bg-slate-50 dark:bg-slate-950 
                    shadow-md overflow-hidden 
                    flex items-center justify-center 
                    hover:shadow-xl hover:scale-[1.02] 
                    transition-all duration-300
                  "
                >
                  {book.coverImage ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 96px, 144px"
                        priority={false}
                      />
                    </div>
                  ) : (
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 w-full">
                <AlertDialogTitle className="text-lg md:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Confirm Book Deletion
                </AlertDialogTitle>

                <AlertDialogDescription className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5">
                  You are about to permanently remove this record from the
                  library database:
                  <span className="flex items-start gap-2.5 mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                    <span className="font-mono text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 wrap-break-word whitespace-normal">
                      {book.title}
                    </span>
                  </span>
                  <span className="block mt-3 text-red-600 dark:text-red-400 font-medium">
                    ⚠️ This action cannot be undone.
                  </span>
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
            <AlertDialogCancel
              className="
                w-full sm:w-auto
                h-10 px-5 text-sm font-medium
                text-slate-700 dark:text-slate-300
                bg-white dark:bg-slate-800
                hover:bg-slate-100 dark:hover:bg-slate-700
                border border-slate-200 dark:border-slate-700
                rounded-lg transition-all duration-200
                shadow-sm m-0
              "
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => onDelete?.(book.id)}
              className="
                w-full sm:w-auto
                h-10 px-5 text-sm font-medium
                bg-linear-to-r from-red-600 to-rose-600 
                hover:from-red-700 hover:to-rose-700
                text-white rounded-lg
                transition-all duration-200
                shadow-sm shadow-red-200 dark:shadow-red-900/30
                flex items-center justify-center m-0
              "
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
