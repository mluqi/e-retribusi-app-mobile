import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

interface User {
  user_code: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  user_level: string;
  user_foto: string | null;
  user_owner: string;
  user_status: string;
}

interface UserContextProps {
  users: User[];
  fetchUsers: (
    page: number,
    limit: number,
    search: string,
    statusFilter: string,
    pasar: string
  ) => Promise<void>;
  addUser: (formData: FormData) => Promise<void>;
  editUser: (user_code: string, formData: FormData) => Promise<void>;
  deleteUser: (user_code: string) => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>([]);

  // const fetchUsers = async () => {
  //   try {
  //     const BASE_URL = "http://localhost:3000/uploads/";
  //     const res = await api.get("/user");
  //     const usersWithPhoto = res.data.map((user: User) => ({
  //       ...user,
  //       user_foto: user.user_foto ? `${BASE_URL}${user.user_foto}` : null,
  //     }));
  //     setUsers(usersWithPhoto);
  //   } catch (error) {
  //     console.error("Failed to fetch users:", error);
  //   }
  // };

  const fetchUsers = async (
    page = 1,
    limit = 10,
    search = "",
    statusFilter = "",
    pasar = ""
  ) => {
    try {
      const BASE_URL = "https://dev1-p3.palindo.id/uploads/";
      const res = await api.get(
        `/user?page=${page}&limit=${limit}&search=${search}&status=${statusFilter}&pasar=${pasar}`
      );
      const usersWithPhoto = res.data.data.map((user: User) => ({
        ...user,
        user_foto: user.user_foto ? `${BASE_URL}${user.user_foto}` : null,
      }));
      setUsers(usersWithPhoto);
      return { totalPages: res.data.totalPages };
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return { totalPages: 1 };
    }
  };

  const addUser = async (formData: FormData) => {
    try {
      await api.post("/user", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchUsers();
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  const editUser = async (user_code: string, formData: FormData) => {
    try {
      await api.put(`/user/${user_code}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchUsers();
    } catch (error) {
      console.error("Failed to edit user:", error);
    }
  };

  const deleteUser = async (user_code: string) => {
    try {
      await api.delete(`/user/${user_code}`);
      await fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{ users, fetchUsers, addUser, editUser, deleteUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
