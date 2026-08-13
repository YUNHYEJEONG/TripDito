import { cn } from "@/lib/utils";

export function ShoppingSection({
  title,
  description,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex flex-col gap-3", className)}>
      <div>
        <h2 className="text-[19px] font-bold leading-7 tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-5 text-ink-2">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
