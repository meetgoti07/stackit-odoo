import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import process from "node:process";
import {nextCookies} from "better-auth/next-js";
import {admin, emailOTP} from "better-auth/plugins";
import {sendOTPEmail} from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    appName: "stackit",
    debug: true,
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false, // don't allow user to set role during signup
            },
            reputation: {
                type: "number",
                required: false,
                defaultValue: 0,
                input: false, // reputation is calculated, not set by user
            },
            bio: {
                type: "string",
                required: false,
            },
            location: {
                type: "string",
                required: false,
            },
            website: {
                type: "string",
                required: false,
            },
        },
    },
    socialProviders: {
        google: {
           clientId: process.env.GOOGLE_CLIENT_ID as string,
           clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        microsoft: {
           clientId: process.env.MICROSOFT_CLIENT_ID as string,
           clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        }
    },
    plugins: [
            nextCookies(),
            admin(),
            emailOTP({
            async sendVerificationOTP({ email, otp}) {
                await sendOTPEmail(email, otp);
            },
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            allowedAttempts: 3,
        })
    ],
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration in seconds
        },
        expiresIn: 60 * 60 * 24 * 2, // 7 days
        updateAge: 60 * 60 * 24 // 1 day (every 1 day the session expiration is updated)
    }
});
