"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";


const SignInPage = () => {


  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
  });

  // const router = useRouter();

  // if (!isLoaded) {
  //   return <Loader />;
  // }

  const validateForm = () => {
    const formErrors = {
      identifier:
        emailAddress === ""
          ? "Email is required"
          : !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailAddress)
          ? "Invalid email format"
          : "",
      password: password === "" ? "Password is required" : "",
    };

    setErrors((prev) => ({ ...prev, ...formErrors }));

    return Object.values(formErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (validateForm()) {
      setIsLoading(true);
      try {
        const result = await signIn.create({
          identifier: emailAddress,
          password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });

        } else {
          console.error("Sign in failed", result);
        }
      } catch (err) {
        if (isClerkAPIResponseError(err)) {
          err.errors.forEach((error) => {
            setErrors((prev) => ({
              ...prev,
              [error.meta?.paramName || ""]: error.message,
            }));
          });
        }
        console.error(JSON.stringify(err, null, 2));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
    <header className="top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/fyp-logo.png"
                alt="EduAssist"
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <button className="px-5 py-2 rounded-md bg-black hover:bg-gray-800 text-white font-medium transition-colors shadow-md">
                Home
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors shadow-md">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
    <div className="flex bg-slate-100">
      <div className="flex-1">
        <main className="mx-auto sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="px-4 sm:px-0 py-6">
            <Card className="mx-auto max-w-md">
              <CardHeader>
                <CardTitle className=" text-4xl text-center font-pacifico text-sky-500">
                  Welcome Back!
                </CardTitle>
                <p className="text-muted-foreground text-center">
                  Sign in to your account
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={emailAddress}
                        placeholder="Enter your email"
                        className={`pl-10 ${
                          errors.identifier !== "" ? "border-red-600" : ""
                        }`}
                        onChange={(e) => {
                          setEmailAddress(e.target.value);
                          setErrors({ ...errors, identifier: "" });
                        }}
                        required
                      />
                      <Mail
                        className="top-1/2 left-3 absolute text-gray-400 transform -translate-y-1/2"
                        size={18}
                      />
                    </div>
                    {errors.identifier && (
                      <p className="text-red-500 text-sm">
                        {errors.identifier}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs italic hover:underline text-blue-600 font-bold"
                      >
                        Forgot password ?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        placeholder="Enter a password"
                        className={`pl-10 ${
                          errors.password !== "" ? "border-red-600" : ""
                        }`}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors({ ...errors, password: "" });
                        }}
                        required
                      />
                      <Lock
                        className="top-1/2 left-3 absolute text-gray-400 transform -translate-y-1/2"
                        size={18}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="top-1/2 right-3 absolute text-gray-400 hover:text-gray-300 transform -translate-y-1/2 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password}</p>
                    )}
                  </div>
                  <Button className="w-full" type="submit">
                    {isLoading ? (
                      <span className="flex justify-center items-center">
                        <svg
                          className="mr-3 -ml-1 w-5 h-5 text-white animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-gray-500 text-sm">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default SignInPage;
