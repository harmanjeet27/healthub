import axios from "axios";

const PaymentButton = ({ amount, user, doctor }) => {
  const loadRazorpay = async () => {
    const { data } = await axios.post("/api/payment/create-order", { amount });

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.order.amount,
      currency: "INR",
      name: "HealthHub",
      description: "Appointment Payment",
      order_id: data.order.id,
      handler: async function (response) {
        await axios.post("/api/payment/verify", {
          ...response,
          userId: user._id,
          doctorId: doctor._id
        });
        alert("Payment Successful");
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button onClick={loadRazorpay}>
      Pay ₹{amount}
    </button>
  );
};

export default PaymentButton;
