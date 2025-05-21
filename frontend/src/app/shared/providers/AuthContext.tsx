// import { createContext, useState, useContext } from "react";
// import { AuthProviderPropsModel } from "../domain/entities/model/AuthProviderPropsModel";
// import { AuthContextModel } from "../domain/entities/model/AuthContextModel";

// const AuthContext = createContext<AuthContextModel | null>(null);
// export function useAuth() {
//     return useContext(AuthContext);
// }

// export const AuthProvider = ({ children }: AuthProviderPropsModel) => {
//     const [isAuthenticated, setIsAuthenticated] = useState( localStorage.getItem('auth') === 'true');

//     const login = () => {
//         setIsAuthenticated(true)
//         localStorage.setItem('auth', 'true');
//         console.log("login: ", isAuthenticated)
//     };
//     const logout = () => setIsAuthenticated(false);

//     return (
//         <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

