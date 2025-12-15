import { prisma } from "../config/database.js";


//Generate server code function
export function generateServerCode(){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code
}

//Generate unique server code
export async function generateUniqueServerCode() {
    let attempts = 0;
    const maxAttempts = 10;
    
    try {
     while(attempts < maxAttempts) {
        const code = generateServerCode();
        const existing = await prisma.server.findUnique({
            where: {serverCode: code}
        })
        if(!existing) return code;
        attempts++;
     }
    return generateServerCode() + Date.now().toString().slice(-4);
    } catch (error) {
        console.error("Error with generating code:", error);
        throw new Error("Failed to generate unique server code");
    }
}

//Check code need generation 
export function shouldRegenerateCode(codeGeneratedAt) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return new Date(codeGeneratedAt) < oneHourAgo;
}