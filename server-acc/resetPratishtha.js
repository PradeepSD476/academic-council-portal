import bcrypt from "bcryptjs";

const newPassword = "ian2424";

const hashedPass = await bcrypt.hash(newPassword, 10);

console.log(hashedPass)
