import Header from "./Header";
import "./../styles/layout.css";

function Layout({ children }) {
  return (
    <div>
      <Header /> {/* Include the Header component here */}
      <main className="content">
        {children} {/* Render the children (page content) */}
      </main>
    </div>
  );
}

export default Layout;

//Made some important changes