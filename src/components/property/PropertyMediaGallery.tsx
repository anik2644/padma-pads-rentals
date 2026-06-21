import { useState, type ReactNode } from "react";
import { ImageIcon, Play, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MediaViewerItem = {
  type: "photo" | "video";
  url: string;
  index: number;
};

interface PropertyMediaGalleryProps {
  photos: string[];
  videos?: string[];
  title: string;
  actions?: ReactNode;
  photoOverlay?: ReactNode;
}

export function PropertyMediaGallery({
  photos,
  videos = [],
  title,
  actions,
  photoOverlay,
}: PropertyMediaGalleryProps) {
  const [viewer, setViewer] = useState<MediaViewerItem | null>(null);
  const visiblePhotos = photos.filter(Boolean);
  const visibleVideos = videos.filter(Boolean);
  const primaryPhoto = visiblePhotos[0] ?? "";

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Photos</h2>
            <p className="text-sm text-muted-foreground">
              {visiblePhotos.length} {visiblePhotos.length === 1 ? "photo" : "photos"}
            </p>
          </div>
        </div>

        {visiblePhotos.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-muted md:col-span-3">
              <button
                type="button"
                onClick={() => setViewer({ type: "photo", url: primaryPhoto, index: 0 })}
                className="h-full w-full text-left"
              >
                <img
                  src={primaryPhoto}
                  alt={title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </button>
              {actions ? <div className="absolute right-3 top-3 flex gap-2">{actions}</div> : null}
              {photoOverlay ? <div className="absolute bottom-3 left-3">{photoOverlay}</div> : null}
            </div>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
              {visiblePhotos.slice(1, 5).map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setViewer({ type: "photo", url: photo, index: index + 1 })}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-border transition hover:ring-primary"
                >
                  <img
                    src={photo}
                    alt={`${title} photo ${index + 2}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {index === 3 && visiblePhotos.length > 5 ? (
                    <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-semibold text-white">
                      +{visiblePhotos.length - 5} more
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-border bg-surface text-center text-sm text-muted-foreground">
            <div>
              <ImageIcon className="mx-auto mb-2 h-8 w-8" />
              No photos uploaded yet.
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Videos</h2>
            <p className="text-sm text-muted-foreground">
              {visibleVideos.length} {visibleVideos.length === 1 ? "video" : "videos"}
            </p>
          </div>
        </div>

        {visibleVideos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleVideos.map((video, index) => (
              <button
                key={`${video}-${index}`}
                type="button"
                onClick={() => setViewer({ type: "video", url: video, index })}
                className="group relative aspect-video overflow-hidden rounded-2xl bg-black text-left ring-1 ring-border transition hover:ring-primary"
              >
                <video
                  src={video}
                  preload="metadata"
                  muted
                  className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/20">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur">
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  </span>
                </span>
                <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                  Video {index + 1}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-36 place-items-center rounded-3xl border border-dashed border-border bg-surface text-center text-sm text-muted-foreground">
            <div>
              <Video className="mx-auto mb-2 h-8 w-8" />
              No videos uploaded yet.
            </div>
          </div>
        )}
      </section>

      <Dialog open={Boolean(viewer)} onOpenChange={(open) => !open && setViewer(null)}>
        <DialogContent className="h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] overflow-hidden border-0 bg-black p-0 text-white sm:h-auto sm:max-h-[92vh] sm:w-[94vw] sm:max-w-6xl sm:rounded-2xl [&>button]:text-white">
          <DialogTitle className="sr-only">
            {viewer?.type === "video" ? "Property video" : "Property photo"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full screen property {viewer?.type ?? "media"} viewer.
          </DialogDescription>
          <div className="min-h-[240px] bg-black">
            {viewer?.type === "photo" ? (
              <img
                src={viewer.url}
                alt={`${title} photo ${viewer.index + 1}`}
                className="h-[100dvh] w-full object-contain sm:max-h-[88vh]"
              />
            ) : null}
            {viewer?.type === "video" ? (
              <video
                src={viewer.url}
                controls
                autoPlay
                className={cn("h-[100dvh] w-full bg-black object-contain sm:max-h-[88vh]")}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
