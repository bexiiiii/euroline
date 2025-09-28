import { Sidebar } from "@/components/ui/modern-side-bar";
import { SimpleTabsWithUnderlineAndBoldFont } from "@/components/ui/simple-tabs-with-underline-and-bold-font";

export function NewsComponent() {
  return (
    <div className="pt-24">
      <div className="container mx-auto px-6">
        <div className="flex gap-8">
          <div className="flex-1">
            <SimpleTabsWithUnderlineAndBoldFont />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsComponent;