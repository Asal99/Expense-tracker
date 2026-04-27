import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
    },

    validate: {
      fullName: (value) =>
        !isLogin && value.trim().length < 3
          ? "Full name must be at least 3 characters"
          : null,

      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),

      password: (value) =>
        value.length >= 6 ? null : "Password must be at least 6 characters",
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post("http://localhost:8000/auth/login", {
          email: values.email,
          password: values.password,
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/dashboard");
      } else {
        await axios.post("http://localhost:8000/auth/register", {
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        });

        alert("Signup successful! Please login.");

        setIsLogin(true);
        form.reset();
      }
    } catch (error) {
      alert(error.response?.data || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-gray-100 to-gray-200">
      <Paper shadow="xl" radius="lg" p="xl" className="w-full max-w-sm mx-auto">
        {/* Title */}
        <Title order={2} ta="center" mb="xs">
          {isLogin ? "Welcome Back 👋" : "Create Account 🚀"}
        </Title>

        <Text size="sm" ta="center" c="dimmed" mb="md">
          {isLogin ? "Login to continue" : "Signup to get started"}
        </Text>

        {/* Form */}
        <form onSubmit={form.onSubmit(handleSubmit)}>
          {!isLogin && (
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              {...form.getInputProps("fullName")}
              mb="sm"
            />
          )}

          <TextInput
            label="Email"
            placeholder="you@gmail.com"
            {...form.getInputProps("email")}
            mb="sm"
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            {...form.getInputProps("password")}
            mb="md"
          />

          <Button
            fullWidth
            size="md"
            radius="md"
            type="submit"
            loading={loading}
            color="indigo"
          >
            {isLogin ? "Login" : "Signup"}
          </Button>
        </form>

        {/* Divider */}
        <Text ta="center" size="sm" mt="md">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </Text>

        {/* Toggle Button */}
        <Group justify="center" mt={5}>
          <Button
            variant="subtle"
            onClick={() => {
              setIsLogin(!isLogin);
              form.reset();
            }}
          >
            {isLogin ? "Switch to Signup" : "Switch to Login"}
          </Button>
        </Group>
      </Paper>
    </div>
  );
};
