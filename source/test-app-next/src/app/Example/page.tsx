// export default (one per file) can be call by any name without {}
import ExampleUi from "@/components/Example";

// normal export (one per file) needed to be call with exact name {Greeting}
import {Greeting} from "@/components/Example";

export default function ExamplePage(){
    return (
        <div>
            <ExampleUi prop1={100000000} prop2="a" />
            {/* Usage — no attributes on the tag at all */}
            <Greeting />
        </div>
    );
}
