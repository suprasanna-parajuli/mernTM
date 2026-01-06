import { CheckCircle2 } from "lucide-react";
import { CT_CLASSES, SORT_OPTIONS } from "../assets/dummy";
import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { useMemo } from "react";
import { Filter } from "lucide-react";
import TaskItem from "../components/TaskItem";

const CompletePage = () => {
  const { tasks, refreshTasks } = useOutletContext();
  const [sortBy, setSortBy] = useState("newest");

  const sortedCompletedTasks = useMemo(() => {
    return tasks
      .filter((task) =>
        [true, 1, "yes"].includes(
          typeof task.completed === "string"
            ? task.completed.toLowerCase()
            : task.completed,
        ),
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt) - new Date(a.createdAt);

          case "oldest":
            return new Date(a.createdAt) - new Date(b.createdAt);
          case "priority":
            const order = { high: 3, medium: 2, low: 1 };
            return (
              order[b.priority?.toLowerCase()] -
              order[a.priority?.toLowerCase()]
            );
          default:
            return 0;
        }
      });
  }, [tasks, sortBy]);
  return (
    <div className={CT_CLASSES.page}>
      {/* HEADER */}
      <div className={CT_CLASSES.header}>
        <div className={CT_CLASSES.titleWrapper}>
          <h1 className={CT_CLASSES.title}>
            <CheckCircle2 className="text-purple-500 size-5 md:size-6 " />
            <span className="truncate">Completed Tasks</span>
          </h1>
          <p className={CT_CLASSES.subtitle}>
            {sortedCompletedTasks.length} task
            {sortedCompletedTasks.length !== 1 && "s"} marked as completed
          </p>
        </div>
        {/* SORT CONTROLS */}
        <div className={CT_CLASSES.sortContainer}>
          <div className={CT_CLASSES.sortBox}>
            <div className={CT_CLASSES.filterLabel}>
              <Filter className="size-4 text-purple-500" />
              <span className="text-sm md:text-sm">Sort By:</span>
            </div>
            {/* MOBILE DROPDOWN */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={CT_CLASSES.select}
            >
              {SORT_OPTIONS.map((opt) => (
                <option value={opt.id} key={opt.id}>
                  {opt.label} {opt.id === "newest" ? "First" : ""}
                </option>
              ))}
            </select>
            {/* DESKTOP BUTTONS */}
            <div className={CT_CLASSES.btnGroup}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={[
                    CT_CLASSES.btnBase,
                    sortBy === opt.id
                      ? CT_CLASSES.btnActive
                      : CT_CLASSES.btnInactive,
                  ].join(" ")}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* TASK LIST */}
      <div className={CT_CLASSES.list}>
        {sortedCompletedTasks.length === 0 ? (
          <div className={CT_CLASSES.emptyState}>
            <div className={CT_CLASSES.emptyIconWrapper}>
              <CheckCircle2 className="size-6 md:size-8 text-purple-500" />
            </div>
            <h3 className={CT_CLASSES.emptyTitle}>No completed tasks yet</h3>
            <p className={CT_CLASSES.emptyText}>
              Complete some task and they will appear here.
            </p>
          </div>
        ) : (
          sortedCompletedTasks.map((task) => (
            <TaskItem
              key={task._id || task.id}
              task={task}
              onRefresh={refreshTasks}
              showCompleteCheckbox={false}
              className="opacity-90 hover:opacity-100 transition-opacity text-sm md:text-base"
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CompletePage;
