// server/controllers/userController.js
const asyncHandler = require('../utils/asyncHandler');
const { clerkClient } = require('@clerk/clerk-sdk-node'); 

// ==========================================
// 🚀 MAIN ONBOARDING & REAL-TIME ML PING
// ==========================================
exports.onboardUser = asyncHandler(async (req, res, next) => {
  const { userId, skills } = req.body;

  if (!userId || !skills || skills.length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and a minimum of 3 skills are required' 
    });
  }

  console.log(`Sending data to ML Server for User: ${userId}...`);
  
  let recommendedCourses = [];

  // Ping the Python Microservice running on port 5001
  try {
    const mlResponse = await fetch('http://localhost:5001/generate-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, skills: skills })
    });
    
    if (mlResponse.ok) {
      const mlData = await mlResponse.json();
      if (mlData.success) {
        recommendedCourses = mlData.recommendedTitles;
        console.log("✅ Received AI Recommendations:", recommendedCourses);
      }
    } else {
      console.log("⚠️ ML Server responded with an error status.");
    }
  } catch (error) {
    console.error("⚠️ ML Server is down or unreachable. Skipping live recommendations.");
    // We don't throw an error here so the user can still finish onboarding 
    // even if the Python server crashes.
  }

  // ==========================================
  // UPDATE CLERK WITH SKILLS & RECOMMENDATIONS
  // ==========================================
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      recommendedCourses: recommendedCourses // Instant AI matches saved to Clerk!
    }
  });

  res.status(200).json({ 
    success: true, 
    message: "Onboarding complete and dashboard curated.",
    curatedData: recommendedCourses
  });
});


// ==========================================
// 🧠 BATCH ML ENDPOINTS
// ==========================================

// 1. Fetch All User IDs for Batch Processing
exports.getAllUserIdsForML = asyncHandler(async (req, res) => {
  try {
    // limit: 500 fixes the pagination issue where it only returned 10 users!
    const users = await clerkClient.users.getUserList({
      limit: 500 
    });
    
    // Support for Clerk SDK v4 and v5 structures
    const userList = users.data ? users.data : users; 
    const userIds = userList.map(u => u.id);

    res.status(200).json({
      success: true,
      totalUsers: userIds.length,
      userIds: userIds
    });
  } catch (error) {
    console.error("Fetch All Users Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user IDs from Clerk" });
  }
});


// 2. Fetch Skills for a specific User ID
exports.getUserSkillsForML = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: "User ID is required in the URL parameters" 
    });
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);

    // Grab skills from unsafeMetadata where the new frontend saves them
    const skills = clerkUser.unsafeMetadata?.savedSkills || [];
    const name = clerkUser.firstName || clerkUser.fullName || "SkillExchange User";

    res.status(200).json({
      success: true,
      userId: clerkUser.id,
      name: name,
      skills: skills,
      count: skills.length
    });

  } catch (error) {
    console.error(`ML Endpoint Error for user ${userId}:`, error.message);
    res.status(404).json({ 
      success: false, 
      message: "User not found in database or error fetching metadata." 
    });
  }
});


// 3. Inject Endpoint for ML Engineer to push batch recommendations
exports.saveMLRecommendations = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { recommendedTitles } = req.body;

  if (!userId || !recommendedTitles) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    // Save the recommended course titles to Clerk's publicMetadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        recommendedCourses: recommendedTitles
      }
    });

    res.status(200).json({ success: true, message: "Recommendations saved successfully" });
  } catch (error) {
    console.error("Save Recommendation Error:", error);
    res.status(500).json({ success: false, message: "Failed to save to Clerk" });
  }
});