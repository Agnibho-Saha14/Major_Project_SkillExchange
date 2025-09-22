import React, { useRef } from "react";
import emailjs from "emailjs-com";
import { useLocation, useNavigate } from "react-router-dom";

const ContactInstructor = () => {
  const form = useRef();
  const location = useLocation();

  // Extract props from navigation state
  const {
    instructorEmail = "",
    instructorName = "",
    courseTitle = "",
    studentEmail = "",
    studentName = "",
    skillId=""
    
  } = location.state || {};
  
  const navigate=useNavigate();
  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,      // Service ID
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,     // Template ID
        form.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY    // Public Key
      )
      .then(
        (result) => {
          console.log("Email sent:", result.text);
          alert("Message sent successfully!");
          
          form.current.reset();
          navigate(`/skills/${skillId}`);
          
        },
        (error) => {
          console.log("Error:", error.text);
          alert("Something went wrong.");
        }
      );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Contact Instructor
        </h2>

        <form ref={form} onSubmit={sendEmail} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              name="from_name"
              defaultValue={studentName}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Email
            </label>
            <input
              type="email"
              name="from_email"
              defaultValue={studentEmail}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              placeholder="Type your message..."
              required
              rows="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Hidden fields */}
          <input type="hidden" name="to_email" value={instructorEmail} />
          <input type="hidden" name="title" value={courseTitle} />
          
          <input type="hidden" name="time" value={new Date().toLocaleString()} />

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};


export default ContactInstructor;
