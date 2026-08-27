"use client";

import { useMemo, useState } from "react";
import { Check, Flame, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Friend } from "@/lib/types";
import {
  addFriend,
  useAvailableUsers,
  useUserFriends,
  type UserProfile,
} from "@/lib/friends";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function statusFor(youSolvedToday: boolean, friend: Friend) {
  const firstName = friend.name.split(" ")[0];
  if (youSolvedToday && friend.friendSolvedToday) {
    return { label: "Kept today — both solved", tone: "text-success", active: true };
  }
  if (youSolvedToday && !friend.friendSolvedToday) {
    return { label: `Waiting on ${firstName}`, tone: "text-muted-foreground", active: false };
  }
  if (!youSolvedToday && friend.friendSolvedToday) {
    return { label: "Your move — solve to keep it", tone: "text-warning", active: false };
  }
  return { label: "At risk — nobody solved yet", tone: "text-danger", active: false };
}

function FriendRow({
  friend,
  youSolvedToday,
  last,
}: {
  friend: Friend;
  youSolvedToday: boolean;
  last: boolean;
}) {
  const status = statusFor(youSolvedToday, friend);

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3",
        !last && "border-b border-border",
      )}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white/90"
        style={{ backgroundColor: friend.hue }}
      >
        {friend.initial}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {friend.name}
        </p>
        <p className={cn("mt-0.5 truncate text-xs", status.tone)}>
          {status.label}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
            status.active ? "text-warning" : "text-muted-foreground",
          )}
          title={`${friend.streak}-day mutual streak · best ${friend.bestStreak}`}
        >
          <Flame
            className={cn("size-3.5", !status.active && "opacity-60")}
          />
          {friend.streak}
        </span>
        <div className="flex items-center gap-1">
          <span
            title="You"
            className={cn(
              "size-2 rounded-full",
              youSolvedToday ? "bg-success" : "bg-white/15",
            )}
          />
          <span
            title={friend.name}
            className={cn(
              "size-2 rounded-full",
              friend.friendSolvedToday ? "bg-success" : "bg-white/15",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function initialsOf(profile: UserProfile) {
  return (profile.name || "?").trim().charAt(0).toUpperCase();
}

/** Dialog listing up to 5 available users with search by email/name. */
function AddFriendDialog() {
  const { user } = useAuth();
  const { users } = useAvailableUsers();
  const { friendIds } = useUserFriends();
  const [search, setSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => !friendIds.has(u.uid) && !addedIds.has(u.uid))
      .filter(
        (u) =>
          q === "" ||
          u.email?.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [users, friendIds, addedIds, search]);

  const handleAdd = async (profile: UserProfile) => {
    if (!user) return;
    setAddedIds((prev) => new Set(prev).add(profile.uid));
    await addFriend(user.uid, profile);
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Add friend"
          >
            <UserPlus className="size-4" />
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add friends</DialogTitle>
          <DialogDescription>
            People on DSA Tracker you can team up with.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 ring-1 ring-inset ring-border transition focus-within:ring-white/20">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex min-h-[12rem] flex-col gap-2">
          {results.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
              {search
                ? "No users match that search."
                : "No other users yet — invite your friends to join!"}
            </p>
          ) : (
            results.map((profile) => (
              <div
                key={profile.uid}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
                  {initialsOf(profile)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile.name}
                  </p>
                  {profile.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 rounded-full"
                  onClick={() => handleAdd(profile)}
                >
                  <UserPlus className="size-3.5" />
                  Add
                </Button>
              </div>
            ))
          )}
        </div>

        {addedIds.size > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-success">
            <Check className="size-3.5" />
            {addedIds.size} friend{addedIds.size > 1 ? "s" : ""} added
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function FriendStreaks({ youSolvedToday }: { youSolvedToday: boolean }) {
  const { friends } = useUserFriends();

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Friend streaks</h2>
        <AddFriendDialog />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Both solve a problem each day to keep the fire alive.
      </p>

      <div className="mt-2 flex flex-col">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/no_friends.png"
              alt=""
              className="size-24 rounded-xl object-contain"
            />
            <p className="text-xs text-muted-foreground">
              No friends added yet.
            </p>
          </div>
        ) : (
          friends.map((friend, i) => (
            <FriendRow
              key={friend.id}
              friend={friend}
              youSolvedToday={youSolvedToday}
              last={i === friends.length - 1}
            />
          ))
        )}
      </div>
    </section>
  );
}
