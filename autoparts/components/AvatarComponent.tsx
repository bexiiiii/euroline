import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvatarComponent() {
  return(
    <>
      <div className="flex gap-4 flex-wrap items-center">
        <Avatar>
          <AvatarImage
            src="https://github.com/preetsuthar17.png"
            alt="@preetsuthar17"
          />
          <AvatarFallback>PS</AvatarFallback>
        </Avatar>
        {/* <Avatar>
          <AvatarImage src="https://github.com/fuma-nama.png" alt="@fuma-nama" />
          <AvatarFallback>FN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar> */}
      </div>
    </>
  );
}
