import Progress from "../models/progressModel.js";
import StudyMaterial from "../models/studyMaterialModel.js";
import Subject from "../models/subjectModel.js";

// Get overall analytics dashboard data
export async function getAnalytics(req, res) {
  try {
    const userId = req.user._id;

    // Get all subjects
    const subjects = await Subject.find({ owner: userId });

    // Get all materials with progress
    const materials = await StudyMaterial.find({ owner: userId }).populate("subject", "name");

    // Calculate total study time from all materials
    let totalStudyMinutes = 0;
    for (let i = 0; i < materials.length; i++) {
      totalStudyMinutes += materials[i].timeSpent || 0;
    }

    // Subject-wise progress
    const subjectProgress = [];
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const subjectMaterials = materials.filter(m => m.subject && m.subject._id.toString() === subject._id.toString());

      let totalTime = 0;
      let totalTarget = 0;
      let completedMaterials = 0;

      for (let j = 0; j < subjectMaterials.length; j++) {
        const mat = subjectMaterials[j];
        totalTime += mat.timeSpent || 0;
        totalTarget += (mat.targetHours || 0) * 60;
        if (mat.progress >= 100) completedMaterials++;
      }

      const overallProgress = totalTarget > 0 ? Math.min(100, (totalTime / totalTarget) * 100) : 0;

      subjectProgress.push({
        subject: subject.name,
        subjectId: subject._id,
        difficulty: subject.difficulty,
        examDate: subject.examDate,
        totalMaterials: subjectMaterials.length,
        completedMaterials: completedMaterials,
        timeSpent: totalTime,
        targetTime: totalTarget,
        progress: Math.round(overallProgress)
      });
    }

    // Weekly study time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentProgress = await Progress.find({
      owner: userId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    const weeklyData = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < recentProgress.length; i++) {
      const entry = recentProgress[i];
      const dayName = days[new Date(entry.date).getDay()];
      if (!weeklyData[dayName]) {
        weeklyData[dayName] = 0;
      }
      weeklyData[dayName] += entry.timeSpent;
    }

    const weeklyChart = days.map(day => ({
      day,
      minutes: weeklyData[day] || 0
    }));

    res.json({
      success: true,
      analytics: {
        totalSubjects: subjects.length,
        totalMaterials: materials.length,
        totalStudyTime: totalStudyMinutes,
        subjectProgress,
        weeklyChart
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
}

// Get progress for a specific subject
export async function getSubjectProgress(req, res) {
  try {
    const userId = req.user._id;
    const { subjectId } = req.params;

    const materials = await StudyMaterial.find({
      owner: userId,
      subject: subjectId
    });

    const progressData = materials.map(mat => ({
      id: mat._id,
      title: mat.title,
      tag: mat.tag,
      timeSpent: mat.timeSpent,
      targetHours: mat.targetHours,
      progress: mat.progress
    }));

    res.json({ success: true, materials: progressData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch subject progress" });
  }
}
