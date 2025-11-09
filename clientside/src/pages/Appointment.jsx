import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { toast } from "react-toastify";
import axios from "axios";

const Appointment = () => {
  const { docId } = useParams();
  const {
    doctors,
    currencySymbol,
    backendUrl,
    token,
    getDoctorsData,
    userData,
  } = useContext(AppContext);

  const navigate = useNavigate();
  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");
  const [isPaid, setIsPaid] = useState(false); // ✅ track payment status

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // ✅ Fetch doctor info
  const fetchDocInfo = async () => {
    const info = doctors.find((doc) => doc._id === docId);
    setDocInfo(info);
  };

  // ✅ Generate available slots
  const getAvailableSlots = async () => {
    if (!docInfo) return;
    setDocSlots([]);
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let endTime = new Date();
      endTime.setDate(today.getDate() + i);
      endTime.setHours(21, 0, 0, 0);

      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(
          currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10
        );
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      let timeSlots = [];
      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const slotDate = `${day}_${month}_${year}`;

        const isSlotAvailable =
          !(
            docInfo?.slots_booked?.[slotDate] &&
            docInfo.slots_booked[slotDate].includes(formattedTime)
          );

        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime,
          });
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  // ✅ Book + Pay
  const bookAppointmentWithPayment = async () => {
    if (!token) {
      toast.warn("Please login first");
      return navigate("/login");
    }

    if (!slotTime) {
      toast.warn("Please select a time slot");
      return;
    }

    try {
      const date = docSlots[slotIndex][0].datetime;
      const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

      // Step 1️⃣: Create Razorpay order
      const { data } = await axios.post(
        `${backendUrl}/api/payment/create-order`,
        {
          amount: docInfo.fees,
          userId: userData._id,
          doctorId: docId,
        },
        { headers: { token } }
      );

      if (!data.success) {
        toast.error("Error: " + data.message);
        return;
      }

      const { order, key } = data;

      // Step 2️⃣: Razorpay Payment
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "HealthHub Appointment",
        description: "Doctor Consultation Fee",
        order_id: order.id,

        handler: async function (response) {
          console.log("Payment handler response:", response);

          if (!response || !response.razorpay_order_id) {
            toast.error("Payment failed or cancelled!");
            return;
          }

          try {
            // Step 3️⃣: Verify Payment
            const verifyRes = await axios.post(
              `${backendUrl}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userData._id,
                doctorId: docId,
                amount: docInfo.fees,
              },
              { headers: { token } }
            );

            if (verifyRes.data.success) {
              // Step 4️⃣: Book Appointment
              const appointmentRes = await axios.post(
                `${backendUrl}/api/user/book-appointment`,
                { docId, slotDate, slotTime },
                { headers: { token } }
              );

              if (appointmentRes.data.success) {
                setIsPaid(true);
                toast.success("Appointment booked successfully!");
                getDoctorsData();
                navigate("/my-appointments");
              } else {
                toast.error("Payment verified, but booking failed!");
              }
            } else {
              toast.error("Payment verification failed!");
            }
          } catch (err) {
            console.error(err);
            toast.error("Error verifying payment");
          }
        },

        prefill: {
          name: userData.name,
          email: userData.email,
          contact: userData.phone || "",
        },
        theme: { color: "#3399cc" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      toast.error("Payment initialization failed");
    }
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) getAvailableSlots();
  }, [docInfo]);

  if (!docInfo) return null;

  return (
    <div>
      {/* Doctor Info */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img
            className="bg-primary w-full sm:max-w-72 rounded-lg"
            src={docInfo.image}
            alt=""
          />
        </div>

        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
            {docInfo.name}
            <img className="w-5" src={assets.verified_icon} alt="" />
          </p>
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>
              {docInfo.degree} - {docInfo.speciality}
            </p>
            <button className="py-0.5 px-2 border text-xs rounded-full">
              {docInfo.experience}
            </button>
          </div>
          <p className="text-gray-500 font-medium mt-4">
            Appointment fee:{" "}
            <span className="text-gray-600">
              {currencySymbol}
              {docInfo.fees}
            </span>
          </p>
        </div>
      </div>

      {/* Slot Selector */}
      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking slots</p>

        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
          {docSlots.map((daySlots, i) => (
            <div
              key={i}
              onClick={() => setSlotIndex(i)}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                slotIndex === i
                  ? "bg-primary text-white"
                  : "border border-gray-200"
              }`}
            >
              <p>{daySlots[0] && daysOfWeek[daySlots[0].datetime.getDay()]}</p>
              <p>{daySlots[0] && daySlots[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
          {docSlots[slotIndex]?.map((slot, i) => (
            <p
              key={i}
              onClick={() => setSlotTime(slot.time)}
              className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                slot.time === slotTime
                  ? "bg-primary text-white"
                  : "text-gray-400 border border-gray-300"
              }`}
            >
              {slot.time.toLowerCase()}
            </p>
          ))}
        </div>

        {/* ✅ Pay/Book Button */}
        <button
          disabled={isPaid}
          onClick={bookAppointmentWithPayment}
          className={`${
            isPaid ? "bg-gray-400 cursor-not-allowed" : "bg-primary"
          } text-white text-sm font-light px-14 py-3 rounded-full my-6`}
        >
          {isPaid
            ? "Payment Completed"
            : `Book & Pay ${currencySymbol}${docInfo.fees}`}
        </button>
      </div>

      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  );
};

export default Appointment;
