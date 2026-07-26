"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { GIFT_TAG_OPTIONS, type GiftTagId } from "../constants/gift-tags";

export function GiftTagField({
  value,
  onChange,
}: {
  value: GiftTagId[];
  onChange: (next: GiftTagId[]) => void;
}) {
  function toggle(id: GiftTagId, checked: boolean) {
    onChange(
      checked
        ? [...new Set([...value, id])]
        : value.filter((tag) => tag !== id),
    );
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {GIFT_TAG_OPTIONS.map((tag) => {
        const checked = value.includes(tag.id);
        return (
          <label
            key={tag.id}
            className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => toggle(tag.id, next === true)}
              aria-label={tag.label}
            />
            {tag.label}
          </label>
        );
      })}
    </div>
  );
}
