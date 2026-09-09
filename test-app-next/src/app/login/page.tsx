"use client";
import {useState} from "react";
import {Eye, EyeOff} from "lucide-react";
const inputBox = "h-10 w-full rounded-md bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative overflow-hidden bg-sidebar min-h-screen flex flex-col items-center py-15 px-3">
      <div className="absolute -left-30 -top-5 size-50 rounded-full bg-[#53A0FD]" />
      <div className="absolute -top-36 -right-20 size-72 rounded-full bg-[#4B3FBD]" />
      <div className="absolute -bottom-24 -left-50 size-70 rounded-full bg-[#87E8C2]" />
      <div className="absolute bottom-25 left-[55%] size-52 rounded-full bg-[#53A0FD]" />

      <h1 className="text-white text-5xl sm:text-6xl scale-y-90 font-extrabold tracking-[9px]">
        <span className="text-brand">VASE</span> LAB
      </h1>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-1 mt-20 w-full max-w-sm rounded-[70px] bg-white/50 p-8 px-16">
        <h2 className="text-2xl font-bold text-white">Login</h2>

        <form className="mt-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-white">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="username@gmail.com" className={inputBox} />
          </div>

          <div className="flex flex-col gap-1.5 ">
            <label htmlFor="password" className="text-sm text-white">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" className={`${inputBox} pr-10`}/>
              <button type="button" onClick={() => setShowPassword(!(showPassword))} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <a href="" className="-mt-3 text-sm text-white hover:underline">
            Forgot Password?
          </a>

          <button type="submit" className="h-10 w-full rounded-md bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/90">
          Don&apos;t have an account yet?
          <br />
          <a href="" className="font-bold text-white hover:underline">
            Click here to Register
          </a>
        </p>
      </div>

    </div>

  );
}
