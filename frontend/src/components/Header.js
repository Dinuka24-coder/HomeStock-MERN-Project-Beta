import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useSpeechRecognition from "../hooks/useSpeechRecognition"; 
import "./../styles/header.css";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState({ profilePic: "" });
  const timeoutRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);

  
  const handleVoiceCommand = (command) => {
    command = command.toLowerCase();

    
    if (command.includes("home")) navigate("/home");
    if (command.includes("inventory")) navigate("/inventory");
    if (command.includes("expenses")) navigate("/expenses");
    if (command.includes("dashboard")) navigate("/dashboard");
    if (command.includes("admin panel")) navigate("/admin-dashboard");

    
    if (command.includes("logout")) {
      localStorage.removeItem("userToken");
      navigate("/");
      speak(" You have been logged out.");
    }

    // 🔹 CRUD Operations for Inventory
    if (command.startsWith("add item")) {
      const parts = command.split(" ");
      const itemName = parts[2]; // Example: "add item Milk"
      const quantity = parseInt(parts[4]) || 1;
      addItemToInventory(itemName, quantity);
    }

    if (command.startsWith("delete item")) {
      const parts = command.split(" ");
      const itemName = parts[2]; // Example: "delete item Milk"
      deleteItemFromInventory(itemName);
    }

    if (command.startsWith("edit item")) {
      const parts = command.split(" ");
      const itemName = parts[2]; // Example: "edit item Milk"
      const newQuantity = parseInt(parts[4]);
      const newCategory = parts.length > 6 ? parts[6] : null;
      editItemInInventory(itemName, newQuantity, newCategory);
    }
  };

  // ✅ Function to make the system speak back
  const speak = (message) => {
    const speech = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(speech);
  };

  // ✅ Use our speech recognition hook (Keeps Mic ON Until Switched OFF)
  const { isListening, setIsListening } = useSpeechRecognition(handleVoiceCommand, true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("userToken");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser({ profilePic: data.profilePic });
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserProfile();
    startInactivityTimer();

    return () => clearTimeout(logoutTimerRef.current);
  }, []);

  const startInactivityTimer = () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
    }, 10 * 60 * 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/");
  };

  const openDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 300);
  };

  // ✅ Function to Add an Item
  const addItemToInventory = async (itemName, quantity) => {
    const token = localStorage.getItem("userToken");

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

    try {
      const response = await fetch("http://localhost:3000/api/inventory/add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName,
          quantity,
          category: "General",
          expiryDate: formattedExpiryDate,
          price: 100,
        }),
      });

      if (response.ok) {
        speak(`${quantity} ${itemName} added successfully.`);
      } else {
        speak("Failed to add item.");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      speak("Failed to add item.");
    }
  };

  // ✅ Function to Delete an Item
  const deleteItemFromInventory = async (itemName) => {
    const token = localStorage.getItem("userToken");

    try {
      // Fetch all items to find the correct item ID
      const response = await fetch("http://localhost:3000/api/inventory/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = await response.json();
      const itemToDelete = items.find(item => item.itemName.toLowerCase() === itemName.toLowerCase());

      if (!itemToDelete) {
        speak(`Item ${itemName} not found.`);
        return;
      }

      // Delete the item using its ID
      const deleteResponse = await fetch(`http://localhost:3000/api/inventory/delete/${itemToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (deleteResponse.ok) {
        speak(`${itemName} deleted successfully.`);
      } else {
        speak("Failed to delete item.");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      speak("Failed to delete item.");
    }
  };

  // ✅ Function to Edit an Item
  const editItemInInventory = async (itemName, newQuantity, newCategory) => {
    const token = localStorage.getItem("userToken");

    try {
      // Fetch all items to find the correct item ID
      const response = await fetch("http://localhost:3000/api/inventory/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = await response.json();
      const itemToUpdate = items.find(item => item.itemName.toLowerCase() === itemName.toLowerCase());

      if (!itemToUpdate) {
        speak(`Item ${itemName} not found.`);
        return;
      }

      // Update the item using its ID
      const updateResponse = await fetch(`http://localhost:3000/api/inventory/update/${itemToUpdate._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quantity: newQuantity || itemToUpdate.quantity,
          category: newCategory || itemToUpdate.category,
        }),
      });

      if (updateResponse.ok) {
        speak(`${itemName} updated.`);
      } else {
        speak("Failed to update item.");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      speak("Failed to update item.");
    }
  };

  return (
    <header className="header">
      <nav className="navbar">
        <ul>
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/inventory">Inventory</Link></li>
          <li><Link to="/expenses">Expenses</Link></li>
          {isAdmin && <li><Link to="/admin-dashboard">Admin Panel</Link></li>}
          <li className="profile-container" onMouseEnter={openDropdown} onMouseLeave={closeDropdown}>
            
          
            
          </li>
          <li>
            <button className={`mic-button ${isListening ? "listening" : ""}`} onClick={() => setIsListening(!isListening)}>
              🎤 {isListening ? "Listening..." : "Voice Control"}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;