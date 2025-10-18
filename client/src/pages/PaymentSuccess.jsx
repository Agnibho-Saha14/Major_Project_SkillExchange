import React, { useState, useEffect, useRef } from "react";
import { useSearchParams,useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PrintableReceipt from "@/components/PrintableReceipt";
import emailjs from "emailjs-com";
import { useAuth, useUser } from '@clerk/clerk-react';

const PaymentSuccess = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const [searchParams] = useSearchParams();
  const skillId = searchParams.get("skillId");
  const sessionId = searchParams.get("sessionId");
  const [skill, setSkill] = useState(null);
  const printableRef = useRef();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const emailSentRef = useRef(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Fetch skill details
  useEffect(() => {
    if (!skillId) return;

    const fetchSkillDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/skills/${skillId}`);
        const result = await response.json();
        if (result.success) {
          setSkill(result.data);
        }
      } catch (err) {
        console.error("Error fetching skill details:", err);
      }
    };

    fetchSkillDetails();
  }, [skillId, API_BASE_URL]);

  // Complete enrollment and send email after success
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !skill || !user) return;

    const completeEnrollmentAndNotify = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/enrollments/complete`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ skillId }),
        });

        const result = await response.json();

        if (!result.success) {
          console.error("Failed to mark enrollment as complete:", result.message);
        } else {
          console.log("Enrollment successfully recorded.");

          // Send email only once and if user has a primary email
          if (!emailSentRef.current && user.primaryEmailAddress?.emailAddress) {

            emailSentRef.current = true;
            const templateParams = {
              to_email: user.primaryEmailAddress.emailAddress,
              from_name: "SkillExchange",
              to_name: user.fullName,
              title:`${skill.title}`,
              name:"SkillExchange",
              message: `You have successfully enrolled in the course: "${skill.title}".`,
            };

            emailjs.send(
              import.meta.env.VITE_EMAILJS_SERVICE_ID,
              import.meta.env.VITE_EMAILJS_ENROLL_TEMPLATE_ID,
              templateParams,
              import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            ).then(
              (res) => {
                console.log("Enrollment email sent!", res.status, res.text);
                
              },
              (err) => console.error("Failed to send email:", err)
            );
          }
        }
      } catch (err) {
        console.error("Error completing enrollment:", err);
      } finally {
        setLoading(false);
      }
    };

    completeEnrollmentAndNotify();
  }, [skill, isLoaded, isSignedIn, user, getToken, skillId, API_BASE_URL]);
  const redirectSkillPage = () => {
    navigate(`/skills/${skillId}`);
  }
  const downloadPDF = async () => {
    if (!printableRef.current) return;

    const canvas = await html2canvas(printableRef.current, { scale: 2, useCORS: true });
    const data = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pdfWidth - 20;
    const pdfHeight = (imgProps.height * contentWidth) / imgProps.width;

    pdf.addImage(data, "PNG", 10, 10, contentWidth, pdfHeight);
    pdf.save(`${skill.title}_receipt.pdf`);
  };

  if (loading || !skill) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Processing your enrollment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <PrintableReceipt ref={printableRef} skill={skill} sessionId={sessionId} />

      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div
          className="p-8 text-white"
          style={{ backgroundImage: "linear-gradient(to right, #4f46e5, #9333ea)" }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Skill Exchange</h2>
            <span className="text-sm font-medium">RECEIPT</span>
          </div>
          <p className="text-indigo-200 mt-4 text-sm">Thank you for your purchase!</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-8">
            <div>
              <p className="text-gray-500">Billed To:</p>
              <p className="font-medium text-gray-800">{user.fullName}</p>
              <p className="text-gray-800">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Transaction ID:</p>
              <p className="font-medium text-gray-800">{sessionId?.slice(8, 21)}</p>
              <p className="text-gray-500">Date:</p>
              <p className="font-medium text-gray-800">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-gray-700 border rounded-lg p-4">
              <div>
                <p className="font-semibold">{skill.title}</p>
                <p className="text-xs text-gray-500">
                  Category: {skill.category} | Level: {skill.level}
                </p>
              </div>
              <p className="font-semibold text-gray-800">₹{skill.price}</p>
            </div>
          </div>

          <div className="mt-8 border-t pt-4">
            <div className="flex justify-between font-semibold text-gray-800">
              <p>Subtotal</p>
              <p>₹{skill.price}</p>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <p>Taxes</p>
              <p>₹0.00</p>
            </div>
            <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t text-indigo-600">
              <p>Total Paid</p>
              <p>₹{skill.price}</p>
            </div>
            
            <div className="flex justify-end mt-1">
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                ✅ Payment Success
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8 gap-4">
        <button
          onClick={downloadPDF}
          className="px-8 py-3 text-base rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-transform transform hover:scale-105"
        >
          Download Receipt
        </button>

        <button
          onClick={redirectSkillPage}
          className="px-8 py-3 text-base rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-transform transform hover:scale-105"
        >
          Go to Skill Page
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
