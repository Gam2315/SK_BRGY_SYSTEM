"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  deleteCommunityPost,
  publishCommunityPost,
  updateCommunityPost,
  type CommunityPostActionState,
} from "@/app/actions/community-posts";
import type { CommunityPostWithImages } from "@/lib/supabase/database.types";

const initialState: CommunityPostActionState = {};

export default function AdminCommunityPostsManager({
  posts,
  error,
}: {
  posts: CommunityPostWithImages[];
  error?: string;
}) {
  const [state, formAction, pending] = useActionState(
    publishCommunityPost,
    initialState,
  );

  return (
    <section
      className="admin-announcement-manager"
      id="community-posts"
      aria-labelledby="community-posts-title"
    >
      <div className="admin-announcement-heading">
        <div>
          <span className="admin-tool-label">COMMUNITY HIGHLIGHTS</span>
          <h3 id="community-posts-title">Activities &amp; completed projects</h3>
          <p>Share community activities and completed barangay projects on the public landing page.</p>
        </div>
      </div>

      <div className="admin-announcement-compose" id="community-post-composer">
        <form action={formAction} className="admin-announcement-form">
          <label>
            <span>Post type</span>
            <select defaultValue="activity" name="kind" required>
              <option value="activity">Activity</option>
              <option value="project">Completed project</option>
            </select>
          </label>
          <label>
            <span>Title</span>
            <input maxLength={160} name="title" placeholder="Post title" required />
          </label>
          <label>
            <span>Description</span>
            <textarea
              maxLength={5000}
              name="body"
              placeholder="Describe the activity or completed project"
              required
              rows={4}
            />
          </label>
          <label>
            <span>Activity or completion date</span>
            <input name="activity_date" required type="date" />
          </label>
          <label>
            <span>Pictures (optional, up to 3)</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              multiple
              name="images"
              type="file"
            />
            <small>JPG, PNG, or WebP. Maximum 4 MB per picture.</small>
          </label>
          <button disabled={pending} type="submit">
            {pending ? "Publishing..." : "Publish post"}
          </button>
        </form>
      </div>

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
      {error && (
        <p className="announcement-action-message error" role="alert">
          Could not load community posts: {error}. Run the community posts setup
          script in Supabase.
        </p>
      )}

      <div className="admin-announcement-list">
        <h4>Published posts ({posts.length})</h4>
        {posts.length === 0 ? (
          <p className="admin-announcement-empty">
            No activities or completed projects have been posted yet.
          </p>
        ) : (
          posts.map((post) => <CommunityPostRow key={post.id} post={post} />)
        )}
      </div>
    </section>
  );
}

function CommunityPostRow({ post }: { post: CommunityPostWithImages }) {
  const updateAction = updateCommunityPost.bind(null, post.id);
  const deleteAction = deleteCommunityPost.bind(null, post.id);
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    initialState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    initialState,
  );

  return (
    <article className="admin-announcement-item">
      <div className="admin-announcement-item-heading">
        <span>{post.kind === "activity" ? "Activity" : "Completed project"}</span>
        <time dateTime={post.activity_date}>
          {new Intl.DateTimeFormat("en-PH", {
            dateStyle: "medium",
            timeZone: "Asia/Manila",
          }).format(new Date(`${post.activity_date}T00:00:00`))}
        </time>
      </div>
      {post.image_urls.length > 0 && (
        <div
          className={`admin-community-post-images admin-community-post-images-${post.image_urls.length}`}
        >
          {post.image_urls.map((imageUrl, index) => (
            <div className="admin-community-post-image" key={imageUrl}>
              <Image
                alt={`${post.title} picture ${index + 1}`}
                fill
                sizes="(max-width: 700px) 100vw, 240px"
                src={imageUrl}
                unoptimized
              />
            </div>
          ))}
        </div>
      )}
      <form action={updateFormAction} className="admin-announcement-form">
        <label>
          <span>Post type</span>
          <select defaultValue={post.kind} name="kind" required>
            <option value="activity">Activity</option>
            <option value="project">Completed project</option>
          </select>
        </label>
        <label>
          <span>Title</span>
          <input defaultValue={post.title} maxLength={160} name="title" required />
        </label>
        <label>
          <span>Description</span>
          <textarea
            defaultValue={post.body}
            maxLength={5000}
            name="body"
            required
            rows={4}
          />
        </label>
        <label>
          <span>Activity or completion date</span>
          <input
            defaultValue={post.activity_date}
            name="activity_date"
            required
            type="date"
          />
        </label>
        <button disabled={updatePending} type="submit">
          {updatePending ? "Saving..." : "Save edits"}
        </button>
      </form>
      {updateState.error && (
        <p className="announcement-action-message error" role="alert">
          {updateState.error}
        </p>
      )}
      {updateState.success && (
        <p className="announcement-action-message success" role="status">
          {updateState.success}
        </p>
      )}
      <form action={deleteFormAction} className="admin-announcement-delete-form">
        <button className="admin-announcement-delete" disabled={deletePending} type="submit">
          {deletePending ? "Deleting..." : "Delete post"}
        </button>
      </form>
      {deleteState.error && (
        <p className="announcement-action-message error" role="alert">
          {deleteState.error}
        </p>
      )}
      {deleteState.success && (
        <p className="announcement-action-message success" role="status">
          {deleteState.success}
        </p>
      )}
    </article>
  );
}
