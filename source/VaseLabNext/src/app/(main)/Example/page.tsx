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


// const chapters = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4"];

// function Filler({ lines = 12 }: { lines?: number }) {
//   return (
//     <>
//       {Array.from({ length: lines }).map((_, i) => (
//         <p key={i} className="py-2 text-gray-600">
//           Line {i + 1} — keep scrolling and watch what sticks.
//         </p>
//       ))}
//     </>
//   );
// }

// export default function Page() {
//   return (
//     <main className="min-h-screen bg-white text-gray-900">
//       {/* 1. STICKY NAVBAR
//           Its parent is <main>, which is the whole page,
//           so it stays stuck the entire time. */}
//       <nav className="sticky top-0 z-20 bg-black px-6 py-4 text-white">
//         1. Sticky navbar (top-0) — parent is the whole page
//       </nav>

//       {/* A hero area, to show sticky doesn't kick in until needed */}
//       <div className="bg-gray-100 px-6 py-20 text-center text-gray-500">
//         Scroll down
//       </div>

//       <div className="mx-auto flex max-w-5xl gap-8 px-6 py-8">
//         {/* 2. STICKY SIDEBAR
//             top-20 = sticks 80px down, just below the navbar.
//             self-start is important: flex children stretch to full
//             height by default, and a full-height element has no room
//             to slide, so sticky would seem to do nothing. */}
//         <aside className="sticky top-20 hidden w-48 self-start rounded-lg border p-4 md:block">
//           <p className="mb-2 font-semibold">2. Sticky sidebar</p>
//           <ul className="space-y-1 text-sm text-gray-600">
//             {chapters.map((c) => (
//               <li key={c}>{c}</li>
//             ))}
//           </ul>
//         </aside>

//         <div className="flex-1">
//           {/* 3. STICKY SECTION HEADERS
//               Each <section> is the parent "track". When a section
//               ends, its header gets pushed away by the next one. */}
//           {chapters.map((c) => (
//             <section key={c} className="mb-8">
//               <h2 className="sticky top-16 z-10 rounded bg-blue-100 px-4 py-2 font-semibold text-blue-900">
//                 3. {c} (sticks until its section ends)
//               </h2>
//               <Filler />
//             </section>
//           ))}

//           {/* 4. THE COMMON BUG
//               The sticky element's parent is barely taller than it,
//               so there's no room to stick. It looks "broken". */}
//           <div className="mb-8 rounded-lg border-2 border-dashed border-red-400 p-4">
//             <div>
//               <h2 className="sticky top-14 bg-red-100 px-4 py-2 font-semibold text-red-900">
//                 4. I don't stick! My parent div is too short.
//               </h2>
//             </div>
//             <Filler lines={8} />
//           </div>
//         </div>
//       </div>

//       {/* 5. STICKY BOTTOM BAR
//           bottom-0 sticks it to the bottom of the screen. */}
//       <div className="sticky bottom-0 z-20 border-t bg-yellow-100 px-6 py-4 text-center text-yellow-900">
//         5. Sticky bottom bar (bottom-0)
//       </div>
//     </main>
//   );
// }