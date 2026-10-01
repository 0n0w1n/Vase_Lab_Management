type Props = {
  children: React.ReactNode;
};

type proptype = {
    prop1: number,
    prop2: string;
}

// export default (one per file) can be call by any name without {}
export default function some_component({ prop1, prop2 }: proptype){
    return (
        <div>
        <h1>h1: {prop1}</h1>
        <h2>h2: {prop2}</h2>
        </div>
    )
}

// normal export (one per file) needed to be call with {Greeting}
// No props needed — nothing in the parentheses
export function Greeting() {
  return <p>Hello there!</p>;
}