// server/controllers/userController.js
const asyncHandler = require('../utils/asyncHandler');
// Depending on your exact Clerk version, clerkClient comes from either of these packages. 
// Since you have both in package.json, this is the standard import:
const { clerkClient } = require('@clerk/clerk-sdk-node'); 

exports.onboardUser = asyncHandler(async (req, res, next) => {
  const { userId, skills } = req.body;

  if (!userId || !skills || skills.length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and a minimum of 3 skills are required' 
    });
  }

  // ==========================================
  // 🔌 THE OUT PORT FOR THE ML ENGINEER
  // ==========================================
  console.log("Data ready for ML Engineer:", skills);
  
  // When the ML engineer is ready, they will give you an endpoint URL.
  // You will forward the `skills` array to them using fetch or axios like this:
  // const mlResponse = await fetch('http://ml-server.yourdomain.com/recommend', {
  //   method: 'POST',
  //   body: JSON.stringify({ skills })
  // });
  // const curatedHomeData = await mlResponse.json();
  
  // For now, let's mock what the ML engineer will return so you can keep building:
  const mockCuratedHomeData = [
    `Course matching: ${skills[0]}`,
    "Trending Skill 1",
    "Community group match"
  ];
  // ==========================================

  // Update Clerk Metadata so the frontend ProtectedRoute knows they finished onboarding
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      curatedHomeData: mockCuratedHomeData // Storing the ML response inside Clerk
    }
  });

  // Return success to the frontend Onboarding page
  res.status(200).json({ 
    success: true, 
    curatedData: mockCuratedHomeData 
  });
});