// export default (one per file) can be call by any name without {}
import ExampleUi from "@/components/Example";

// normal export (one per file) needed to be call with exact name {Greeting}
import {Greeting} from "@/components/Example";

export default function ExamplePage() {
  return (
    /* Centers content up to 1280px wide with responsive horizontal padding */
    <div className="flex flex-col mx-auto px-15">
      <ExampleUi prop1={100000000} prop2="a" />
      <Greeting />
    </div>
  );
}
