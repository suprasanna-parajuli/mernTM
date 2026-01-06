import { ListChecks, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { layoutClasses, SORT_OPTIONS } from "../assets/dummy";
import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Filter } from "lucide-react";
import { Plus } from "lucide-react";
import { Clock } from "lucide-react";
import TaskItem from "../components/TaskItem";
import TaskModal from "../components/TaskModal";
import axios from "axios";

const PendingPage = () => {
  const { tasks = [], refreshTasks } = useOutletContext();
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);

  useEffect(function () {
    fetchSubjects();
    fetchMaterials();
  }, []);

  async function fetchSubjects() {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:4000/api/subjects/gp", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchMaterials() {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:4000/api/materials/gp", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaterials(data.materials || []);
    } catch (error) {
      console.error(error);
    }
  }

  const sortedPendingTasks = useMemo(() => {
    // Filter regular pending tasks
    const filtered = tasks.filter(
      (t) =>
        !t.completed ||
        (typeof t.completed === "string" && t.completed.toLowerCase() === "no"),
    );

    // Add subjects as "exam preparation" tasks
    const now = new Date();
    const upcomingSubjects = subjects
      .filter(s => new Date(s.examDate) > now)
      .map(s => ({
        _id: `subject-${s._id}`,
        title: `${s.name} - Exam Preparation`,
        description: `Prepare for ${s.name} exam`,
        priority: s.priorityScore > 0.7 ? "high" : s.priorityScore > 0.4 ? "medium" : "low",
        dueDate: s.examDate,
        completed: false,
        createdAt: s.createdAt,
        isSubject: true,
        subjectData: s
      }));

    // Add materials as study tasks (only incomplete ones: progress < 100%)
    const incompleteMaterials = materials
      .filter(m => (m.progress || 0) < 100)
      .map(m => {
        // Find the subject for this material to get priority
        const subject = subjects.find(s => s._id === m.subject);
        return {
          _id: `material-${m._id}`,
          title: `Study: ${m.title}`,
          description: `${m.tag} - ${m.progress || 0}% complete`,
          priority: subject?.priorityScore > 0.7 ? "high" : subject?.priorityScore > 0.4 ? "medium" : "low",
          dueDate: subject?.examDate || null,
          completed: false,
          createdAt: m.createdAt,
          isMaterial: true,
          materialData: m
        };
      });

    const combined = [...filtered, ...upcomingSubjects, ...incompleteMaterials];

    return combined.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.priority.toLowerCase()] - order[a.priority.toLowerCase()];
    });
  }, [tasks, subjects, materials, sortBy]);

  return (
    <div className={layoutClasses.container}>
      <div className={layoutClasses.headerWrapper}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ListChecks className="text-purple-500" /> Pending Tasks
          </h1>
          <p className="text-sm text-gray-800 mt-1 ml-7">
            {sortedPendingTasks.length} task
            {sortedPendingTasks.length !== 1 && "s"} needing your attention
          </p>
        </div>
        <div className={layoutClasses.sortBox}>
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="size-4 text-purple-500 " />
            <span className="text-sm">Sort By:</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={layoutClasses.select}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">By Priority</option>
          </select>

          <div className={layoutClasses.tabWrapper}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={layoutClasses.tabButton(sortBy === opt.id)}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={layoutClasses.addBox} onClick={() => setShowModal(true)}>
        <div className="flex items-center justify-center gap-3 text-gray-500 group-hover:text-purple-600 transition-colors ">
          <div className="size-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <Plus className="text-purple-500" size={18} />
          </div>
          <span className="font-medium">Add New Task</span>
        </div>
      </div>

      <div className="space-y-4">
        {sortedPendingTasks.length === 0 ? (
          <div className={layoutClasses.emptyState}>
            <div className="max-w-xs mx-auto py-6 ">
              <div className={layoutClasses.emptyIconBg}>
                <Clock className="size-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                All caught up
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                No pending tasks - great work!
              </p>
              <button
                onClick={() => setShowModal(true)}
                className={layoutClasses.emptyBtn}
              >
                Create New Task
              </button>
            </div>
          </div>
        ) : (
          sortedPendingTasks.map((task) => (
            <TaskItem
              key={task._id || task.id}
              task={task}
              showCompleteCheckbox
              onDelete={() => handleDelete(task._id || task.id)}
              onToggleComplete={() =>
                handleToggleComplete(task._id || task.id, t.completed)
              }
              onEdit={() => {
                setSelectedTask(task);
                setShowModal(true);
              }}
              onRefresh={refreshTasks}
            />
          ))
        )}
      </div>
      <TaskModal
        isOpen={!!selectedTask || showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null);
          refreshTasks();
        }}
        taskToEdit={selectedTask}
      />
    </div>
  );
};

export default PendingPage;
