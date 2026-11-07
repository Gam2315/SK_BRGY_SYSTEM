"use client";

import Image from "next/image";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  updateBarangayOfficial,
  type BarangayOfficialActionState,
} from "@/app/actions/barangay-officials";
import type { BarangayOfficial } from "@/lib/supabase/database.types";

const initialState: BarangayOfficialActionState = {};
type BarangayOfficialWithPhoto = BarangayOfficial & {
  photo_url: string | null;
};

export default function AdminBarangayOfficialsManager({
  officials,
  error,
}: {
  officials: BarangayOfficialWithPhoto[];
  error?: string;
}) {
  const [selectedOfficialId, setSelectedOfficialId] = useState(
    officials[0]?.id ?? "",
  );
  const selectedOfficial = officials.find(
    (official) => official.id === selectedOfficialId,
  );

  return (
    <section
      aria-labelledby="officials-manager-title"
      className="admin-announcement-manager"
    >
      <div className="admin-announcement-heading">
        <div>
          <span className="admin-tool-label">PUBLIC PORTAL</span>
          <h2 id="officials-manager-title">Manage Barangay Officials</h2>
          <p>
            Select a designated position to edit its public details.
          </p>
        </div>
      </div>

      {error ? (
        <div className="announcement-action-message error" role="alert">
          Could not load official records: {error}. Run{" "}
          <code>supabase/barangay-officials.sql</code> in the Supabase SQL
          Editor, then refresh this page.
        </div>
      ) : officials.length === 0 ? (
        <p className="admin-announcement-empty">
          No official positions were found. Run the barangay officials setup
          SQL in Supabase, then refresh this page.
        </p>
      ) : (
        <div className="admin-officials-editor">
          <label className="admin-official-position-select">
            <span>Designated position</span>
            <select
              onChange={(event) => setSelectedOfficialId(event.target.value)}
              value={selectedOfficial?.id ?? ""}
            >
              {officials.map((official) => (
                <option key={official.id} value={official.id}>
                  {official.position}
                </option>
              ))}
            </select>
          </label>
          {selectedOfficial && (
            <OfficialEditor
              key={selectedOfficial.id}
              official={selectedOfficial}
            />
          )}
        </div>
      )}
    </section>
  );
}

function OfficialEditor({ official }: { official: BarangayOfficialWithPhoto }) {
  const action = updateBarangayOfficial.bind(null, official.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropSource, setCropSource] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [croppedPhotoUrl, setCroppedPhotoUrl] = useState<string | null>(null);
  const [photoSelectionError, setPhotoSelectionError] = useState("");

  useEffect(
    () => () => {
      if (cropSource) URL.revokeObjectURL(cropSource.url);
      if (croppedPhotoUrl) URL.revokeObjectURL(croppedPhotoUrl);
    },
    [cropSource, croppedPhotoUrl],
  );

  function handlePhotoSelection(file: File | undefined) {
    if (!file || file.size === 0) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      if (photoInputRef.current) photoInputRef.current.value = "";
      setPhotoSelectionError(
        "Profile pictures must be JPG, PNG, or WebP files up to 5 MB.",
      );
      return;
    }

    setPhotoSelectionError("");
    setCroppedPhotoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setCropSource({ file, url: URL.createObjectURL(file) });
  }

  function handleCropCancel() {
    setCropSource((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function handleCropComplete(file: File) {
    const input = photoInputRef.current;
    if (!input) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;

    setCroppedPhotoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setCropSource((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  return (
    <article className="admin-official-item">
      <div className="admin-announcement-item-heading">
        <strong>{official.position}</strong>
        <span>{official.is_published ? "Published" : "Not published"}</span>
      </div>
      <form action={formAction} className="admin-announcement-form">
        <div className="admin-official-photo-field">
          {croppedPhotoUrl ? (
            <Image
              alt={`${official.position} profile picture preview`}
              className="admin-official-photo-preview"
              height={96}
              src={croppedPhotoUrl}
              unoptimized
              width={96}
            />
          ) : official.photo_url ? (
            <Image
              alt={`${official.position} profile picture`}
              className="admin-official-photo-preview"
              height={96}
              src={official.photo_url}
              unoptimized
              width={96}
            />
          ) : (
            <span className="admin-official-photo-placeholder" aria-hidden="true">
              ♙
            </span>
          )}
          <label>
            <span>Profile picture</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              name="photo"
              onChange={(event) =>
                handlePhotoSelection(event.currentTarget.files?.[0])
              }
              ref={photoInputRef}
              type="file"
            />
            <small>JPG, PNG, or WebP · up to 5 MB · square crop</small>
          </label>
        </div>
        {photoSelectionError && (
          <p className="announcement-action-message error" role="alert">
            {photoSelectionError}
          </p>
        )}
        <label>
          <span>Official&apos;s name</span>
          <input
            defaultValue={official.full_name ?? ""}
            maxLength={120}
            name="full_name"
            placeholder="Enter full name"
          />
        </label>
        <label>
          <span>Phone number</span>
          <input
            defaultValue={official.phone ?? ""}
            maxLength={40}
            name="phone"
            pattern="\+63[ ()-]?[2-9][0-9 ()-]{7,12}[0-9]"
            placeholder="+63 917 123 4567"
            title="Use +63 followed by a valid Philippine phone number."
            type="tel"
          />
          <small>
            Optional · Use +63 followed by a valid Philippine number.
          </small>
        </label>
        <label>
          <span>Email address</span>
          <input
            defaultValue={official.email ?? ""}
            maxLength={254}
            name="email"
            placeholder="Optional"
            type="email"
          />
        </label>
        <label>
          <span>Public display</span>
          <select
            defaultValue={official.is_published ? "true" : "false"}
            name="is_published"
          >
            <option value="false">Keep private</option>
            <option value="true">Publish on public portal</option>
          </select>
        </label>
        <button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save official"}
        </button>
      </form>
      {state.error && (
        <p className="announcement-action-message error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="announcement-action-message success" role="status">
          {state.success}
        </p>
      )}
      {state.warning && (
        <p className="announcement-action-message warning" role="alert">
          {state.warning}
        </p>
      )}
      {cropSource && (
        <ProfilePhotoCropper
          file={cropSource.file}
          imageUrl={cropSource.url}
          onCancel={handleCropCancel}
          onComplete={handleCropComplete}
        />
      )}
    </article>
  );
}

function ProfilePhotoCropper({
  file,
  imageUrl,
  onCancel,
  onComplete,
}: {
  file: File;
  imageUrl: string;
  onCancel: () => void;
  onComplete: (croppedFile: File) => void;
}) {
  const viewportSize = 280;
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const baseScale = imageSize
    ? Math.max(viewportSize / imageSize.width, viewportSize / imageSize.height)
    : 1;
  const imageWidth = imageSize ? imageSize.width * baseScale * zoom : viewportSize;
  const imageHeight = imageSize ? imageSize.height * baseScale * zoom : viewportSize;

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: offset.x,
      y: offset.y,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const maxX = Math.max(0, (imageWidth - viewportSize) / 2);
    const maxY = Math.max(0, (imageHeight - viewportSize) / 2);
    setOffset({
      x: Math.max(
        -maxX,
        Math.min(
          maxX,
          dragStart.current.x + event.clientX - dragStart.current.pointerX,
        ),
      ),
      y: Math.max(
        -maxY,
        Math.min(
          maxY,
          dragStart.current.y + event.clientY - dragStart.current.pointerY,
        ),
      ),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function cropImage() {
    const image = new window.Image();
    image.src = imageUrl;
    try {
      await image.decode();
      const sourceScale = baseScale * zoom;
      const sourceSize = viewportSize / sourceScale;
      const sourceX = Math.max(
        0,
        Math.min(
          image.naturalWidth - sourceSize,
          (imageWidth / 2 - offset.x - viewportSize / 2) / sourceScale,
        ),
      );
      const sourceY = Math.max(
        0,
        Math.min(
          image.naturalHeight - sourceSize,
          (imageHeight / 2 - offset.y - viewportSize / 2) / sourceScale,
        ),
      );
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) {
        setError("Could not prepare the image crop. Please try again.");
        return;
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob) {
        setError("Could not create the cropped image. Please try again.");
        return;
      }

      onComplete(
        new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, "")}-cropped.jpg`,
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          },
        ),
      );
    } catch (cropError) {
      console.error("Could not crop barangay official profile picture:", cropError);
      setError("Could not crop this image. Please select another picture.");
    }
  }

  return (
    <div
      aria-labelledby="official-photo-crop-title"
      aria-modal="true"
      className="official-photo-crop-backdrop"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      role="dialog"
    >
      <section className="official-photo-crop-dialog">
        <h3 id="official-photo-crop-title">Crop profile picture</h3>
        <p>Drag the image to adjust the crop, then use the slider to zoom.</p>
        <div
          aria-label="Profile picture crop area. Drag to reposition."
          className="official-photo-crop-viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ width: viewportSize, height: viewportSize }}
        >
          <Image
            alt=""
            draggable={false}
            onLoad={(event) =>
              setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            onError={() =>
              setError("Could not load this image. Please select another picture.")
            }
            unoptimized
            src={imageUrl}
            style={{
              width: imageWidth,
              height: imageHeight,
              left: `calc(50% + ${offset.x}px)`,
              top: `calc(50% + ${offset.y}px)`,
            }}
            width={imageWidth}
            height={imageHeight}
          />
        </div>
        <label className="official-photo-crop-zoom">
          <span>Zoom</span>
          <input
            max="3"
            min="1"
            onChange={(event) => {
              const nextZoom = Number(event.currentTarget.value);
              setZoom(nextZoom);
              setOffset((current) => {
                const nextWidth = imageSize
                  ? imageSize.width * baseScale * nextZoom
                  : viewportSize;
                const nextHeight = imageSize
                  ? imageSize.height * baseScale * nextZoom
                  : viewportSize;
                return {
                  x: Math.max(
                    -(nextWidth - viewportSize) / 2,
                    Math.min((nextWidth - viewportSize) / 2, current.x),
                  ),
                  y: Math.max(
                    -(nextHeight - viewportSize) / 2,
                    Math.min((nextHeight - viewportSize) / 2, current.y),
                  ),
                };
              });
            }}
            step="0.05"
            type="range"
            value={zoom}
          />
        </label>
        {error && (
          <p className="announcement-action-message error" role="alert">
            {error}
          </p>
        )}
        <div className="official-photo-crop-actions">
          <button onClick={onCancel} ref={cancelButtonRef} type="button">
            Cancel
          </button>
          <button disabled={!imageSize} onClick={() => void cropImage()} type="button">
            Use cropped photo
          </button>
        </div>
      </section>
    </div>
  );
}
