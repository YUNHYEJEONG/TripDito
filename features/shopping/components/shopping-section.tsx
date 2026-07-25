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
    <section id={id} className={cn("flex flex-col gap-2.5", className)}>
      <div className="px-0.5">
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
