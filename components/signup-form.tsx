"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BsGoogle, BsMicrosoft } from "react-icons/bs";
import { FaGithub } from "react-icons/fa";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

type SignupFormProps = React.ComponentProps<"div">

export function SignupForm({ className, ...props }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        image: image || undefined,
        bio: bio || undefined,
        location: location || undefined,
        website: website || undefined,
        callbackURL: "/",
      });

      if (error) {
        setError(error.message || "Failed to create account. Please try again.");
      } else if (data) {
        console.log("Signup successful:", data);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });

      if (error) {
        setError(error.message || `Failed to sign up with ${provider}.`);
      } else if (data) {
        console.log(`${provider} signup successful:`, data);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleEmailSignup}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-muted-foreground text-balance">
                      Sign up for your Inslyt account
                    </p>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}

                  {/* Required Fields - 2 Column layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="New York, NY"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Full Width Fields */}
                  <div className="grid gap-3">
                    <Label htmlFor="image">Profile Image URL</Label>
                    <Input
                      id="image"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>

                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full"
                      onClick={() => handleSocialSignup("microsoft")}
                      disabled={isLoading}
                      aria-label="Sign up with Microsoft"
                    >
                      <BsMicrosoft />
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full"
                      onClick={() => handleSocialSignup("google")}
                      disabled={isLoading}
                      aria-label="Sign up with Google"
                    >
                      <BsGoogle />
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full"
                      onClick={() => handleSocialSignup("github")}
                      disabled={isLoading}
                      aria-label="Sign up with GitHub"
                    >
                      <FaGithub />
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-muted-foreground text-center text-xs text-balance">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>.
          </div>
        </div>
      </div>
    </div>
  );
}
