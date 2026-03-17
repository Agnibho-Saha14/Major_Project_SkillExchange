// server/controllers/userController.js
const asyncHandler = require('../utils/asyncHandler');
const { clerkClient } = require('@clerk/clerk-sdk-node'); 

exports.onboardUser = asyncHandler(async (req, res, next) => {
  const { userId, skills } = req.body;

  if (!userId || !skills || skills.length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID and a minimum of 3 skills are required' 
    });
  }

  // Fallback ML mock data
  const mockCuratedHomeData = [
    `Course matching: ${skills[0]}`,
    "Trending Skill 1",
    "Community group match"
  ];

  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      curatedHomeData: mockCuratedHomeData
    }
  });

  res.status(200).json({ 
    success: true, 
    curatedData: mockCuratedHomeData 
  });
});

// ==========================================
// 🧠 ML ENGINEER ENDPOINTS
// ==========================================

// 1. Fetch All User IDs for Batch Processing
exports.getAllUserIdsForML = asyncHandler(async (req, res) => {
  try {
    // Add the { limit: 500 } parameter here!
    // If you expect more than 500 users, you will need to implement offset pagination.
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