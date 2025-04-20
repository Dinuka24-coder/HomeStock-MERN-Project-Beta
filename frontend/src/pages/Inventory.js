import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import "../styles/inventory.css"; // New CSS file for styles
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation function

function Inventory() {
  const [items, setItems] = useState([]);
  const [editItem, setEditItem] = useState(null); // Track the item being edited
  const [newItem, setNewItem] = useState({
    itemName: "",
    quantity: "",
    category: "",
    expiryDate: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const token = localStorage.getItem("userToken");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/inventory/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        setItems(data);
      } else {
        console.error("Error fetching inventory:", data.message);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("userToken");

    if (!newItem.itemName || !newItem.quantity || !newItem.category || !newItem.price) {
      console.error("Please fill in all required fields.");
      return;
    }

    if (newItem.quantity < 0 || newItem.price < 0) {
      console.error("Quantity and price must be non-negative numbers.");
      return;
    }

    if (editItem) {
      try {
        const response = await fetch(`http://localhost:3000/api/inventory/update/${editItem._id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newItem),
        });

        const data = await response.json();
        if (response.ok) {
          setItems(items.map(item => (item._id === editItem._id ? data.item : item)));
          setEditItem(null);
        } else {
          console.error("Error updating item:", data.message);
        }
      } catch (error) {
        console.error("Error updating item:", error);
      }
    } else {
      try {
        const response = await fetch("http://localhost:3000/api/inventory/add", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newItem),
        });

        const data = await response.json();
        if (response.ok) {
          setItems([...items, data.newItem]);
        } else {
          console.error("Error adding item:", data.message);
        }
      } catch (error) {
        console.error("Error adding item:", error);
      }
    }

    setNewItem({ itemName: "", quantity: "", category: "", expiryDate: "", price: "" });
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setNewItem({
      itemName: item.itemName,
      quantity: item.quantity,
      category: item.category,
      expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
      price: item.price,
    });
  };

  const handleDeleteItem = async (itemId) => {
    const token = localStorage.getItem("userToken");

    try {
      const response = await fetch(`http://localhost:3000/api/inventory/delete/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        setItems(items.filter((item) => item._id !== itemId));
      } else {
        console.error("Error deleting item:", data.message);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <Layout>
      <div className="inventory-container">
        <h2>Inventory Management</h2>

        <form className="inventory-form" onSubmit={handleAddOrUpdateItem}>
          <input type="text" placeholder="Item Name" required value={newItem.itemName} onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })} />
          <input type="number" placeholder="Quantity" required min="0" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
          <input type="text" placeholder="Category" required value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
          <input type="date" placeholder="Expiry Date" value={newItem.expiryDate} onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })} />
          <input type="number" placeholder="Price" required min="0" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
          <button type="submit">{editItem ? "Update Item" : "Add Item"}</button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="inventory-grid">
            {items.map((item) => (
              <div key={item._id} className="inventory-item">
                <h3>{item.itemName}</h3>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Expiry:</strong> {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}</p>
                <p><strong>Price:</strong> R.S {item.price}</p>
                <div className="inventory-buttons">
                  <button className="edit-btn" onClick={() => handleEditItem(item)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteItem(item._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Inventory;
