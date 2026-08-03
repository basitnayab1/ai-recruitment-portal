"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CandidateAvatar } from "@/components/shared/candidate-avatar";
import { FormAlert } from "@/components/shared/form-alert";
import { FILE_INPUT } from "@/lib/ui/classes";
import {
  deleteProfilePicture,
  uploadProfilePicture,
  type DeleteProfilePictureState,
  type UploadProfilePictureState,
} from "@/lib/candidate/profile-picture-actions";
import {
  isAllowedProfilePictureFile,
  PROFILE_PICTURE_ACCEPT,
} from "@/lib/candidate/profile-picture-constants";

const uploadInitialState: UploadProfilePictureState = undefined;
const deleteInitialState: DeleteProfilePictureState = undefined;

export function ProfilePictureManager({
  fullName,
  hasPicture,
  pictureUrl,
}: {
  fullName: string;
  hasPicture: boolean;
  pictureUrl: string | null;
}) {
  const router = useRouter();
  const [clientError, setClientError] = useState<string | null>(null);
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadProfilePicture,
    uploadInitialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProfilePicture,
    deleteInitialState
  );

  useEffect(() => {
    if (uploadState?.status === "success" || deleteState?.status === "success") {
      setClientError(null);
      router.refresh();
    }
  }, [uploadState, deleteState, router]);

  const showPicture = hasPicture || uploadState?.status === "success";
  const activePictureUrl = deleteState?.status === "success" ? null : pictureUrl;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <CandidateAvatar name={fullName} pictureSrc={showPicture ? activePictureUrl : null} size="lg" />

      <div className="min-w-0 flex-1 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-white">Profile Picture</h3>
          <p className="mt-1 text-xs text-zinc-400">
            JPG, PNG, or WEBP. Maximum file size: 1 MB. Large images are resized automatically.
          </p>
        </div>

        <form
          action={uploadAction}
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            const form = event.currentTarget;
            const input = form.elements.namedItem("picture");
            const file =
              input instanceof HTMLInputElement && input.files?.[0] ? input.files[0] : null;
            // Size is validated after server-side compression; only check type here.
            if (file && !isAllowedProfilePictureFile(file)) {
              event.preventDefault();
              setClientError("Please upload a JPG, PNG, or WEBP image.");
              return;
            }
            setClientError(null);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="picture">{showPicture ? "Replace picture" : "Upload picture"}</Label>
            <input
              id="picture"
              name="picture"
              type="file"
              accept={PROFILE_PICTURE_ACCEPT}
              required={!showPicture}
              disabled={uploadPending}
              className={FILE_INPUT}
              onChange={() => setClientError(null)}
            />
          </div>

          {clientError ? <FormAlert variant="error">{clientError}</FormAlert> : null}
          {uploadState?.status === "error" ? (
            <FormAlert variant="error">{uploadState.message}</FormAlert>
          ) : null}
          {uploadState?.status === "success" ? (
            <FormAlert variant="success">{uploadState.message}</FormAlert>
          ) : null}

          <Button type="submit" disabled={uploadPending} aria-busy={uploadPending}>
            {uploadPending ? "Uploading…" : showPicture ? "Replace Picture" : "Upload Picture"}
          </Button>
        </form>

        {showPicture ? (
          <form
            action={deleteAction}
            className="space-y-2"
            onSubmit={(event) => {
              if (!window.confirm("Remove your profile picture?")) {
                event.preventDefault();
              }
            }}
          >
            {deleteState?.status === "error" ? (
              <FormAlert variant="error">{deleteState.message}</FormAlert>
            ) : null}
            {deleteState?.status === "success" ? (
              <FormAlert variant="success">{deleteState.message}</FormAlert>
            ) : null}
            <Button type="submit" variant="outline" size="sm" disabled={deletePending} aria-busy={deletePending}>
              {deletePending ? "Removing…" : "Remove Picture"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
