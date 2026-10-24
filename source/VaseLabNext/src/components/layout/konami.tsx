"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";


export default function SecretCode() {
    let code = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    let current_code = [...code];

    function activate() {
        redirect("/tic-tac-toe");
    }

    function enterCode(keyevent: KeyboardEvent) {
        console.log(code);
        console.log(current_code);
        if (keyevent.key.toLowerCase() === current_code[0]) {
            current_code.shift();
            if (current_code.length <= 0) {
                activate();
            }
        }
        else {
            current_code = [...code];
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", enterCode);
        return () => document.removeEventListener("keydown", enterCode);
    }, [])
    return null;
}

