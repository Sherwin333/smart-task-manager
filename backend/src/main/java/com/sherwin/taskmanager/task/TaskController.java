package com.sherwin.taskmanager.task;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

  private final TaskRepository tasks;

  // ---- List (ordered column-wise: Todo -> In Progress -> Done) ----
  @GetMapping
  public List<Task> list() {
    List<Task> out = new ArrayList<>();
    out.addAll(tasks.findAllByStatusOrderByPositionAsc("Todo"));
    out.addAll(tasks.findAllByStatusOrderByPositionAsc("In Progress"));
    out.addAll(tasks.findAllByStatusOrderByPositionAsc("Done"));
    return out;
  }

  // ---- Create (append to bottom of its column) ----
  @PostMapping
  @Transactional
  public Task create(@RequestBody Map<String, String> body) {
    String title = body.getOrDefault("title", "New Task");
    String status = body.getOrDefault("status", "Todo");

    int max = tasks.findAllByStatusOrderByPositionAsc(status)
                   .stream().map(Task::getPosition).max(Integer::compareTo).orElse(-1);

    Task t = new Task();
    t.setTitle(title);
    t.setStatus(status);
    t.setPosition(max + 1);
    return tasks.save(t);
  }

  // ---- Move to another column, always to bottom (simple move) ----
  @PatchMapping("/{id}/move")
  @Transactional
  public ResponseEntity<Void> move(@PathVariable long id, @RequestBody Map<String, String> body) {
    String to = body.getOrDefault("status", "Todo");
    Task t = tasks.findById(id).orElseThrow();

    if (!Objects.equals(t.getStatus(), to)) {
      // close gap in old column
      var fromList = tasks.findAllByStatusOrderByPositionAsc(t.getStatus());
      int fromIndex = indexOf(fromList, id);
      for (int i = fromIndex + 1; i < fromList.size(); i++) fromList.get(i).setPosition(i - 1);
      tasks.saveAll(fromList);

      // append to bottom in new column
      int max = tasks.findAllByStatusOrderByPositionAsc(to)
                     .stream().map(Task::getPosition).max(Integer::compareTo).orElse(-1);
      t.setStatus(to);
      t.setPosition(max + 1);
      tasks.save(t);
    }
    return ResponseEntity.noContent().build();
  }

  // ---- Reorder: precise insert at index, within or across columns ----
  @PatchMapping("/{id}/reorder")
  @Transactional
  public ResponseEntity<Void> reorder(@PathVariable long id, @RequestBody Map<String, Object> body) {
    String toStatus = String.valueOf(body.getOrDefault("status", "Todo"));
    int toIndex = ((Number) body.getOrDefault("index", 0)).intValue();

    var task = tasks.findById(id).orElseThrow();
    String fromStatus = task.getStatus();

    // Same column: shift range and drop at target index
    if (fromStatus.equals(toStatus)) {
      var same = tasks.findAllByStatusOrderByPositionAsc(fromStatus);
      int fromIndex = indexOf(same, id);
      if (fromIndex == toIndex) return ResponseEntity.noContent().build();

      if (toIndex < fromIndex) {
        for (int i = toIndex; i < fromIndex; i++) same.get(i).setPosition(i + 1);
      } else {
        for (int i = fromIndex + 1; i <= toIndex; i++) same.get(i).setPosition(i - 1);
      }
      task.setPosition(toIndex);
      tasks.saveAll(same);
      tasks.save(task);
      return ResponseEntity.noContent().build();
    }

    // Cross-column:
    // 1) close gap in old column
    var from = tasks.findAllByStatusOrderByPositionAsc(fromStatus);
    int fromIndex = indexOf(from, id);
    for (int i = fromIndex + 1; i < from.size(); i++) from.get(i).setPosition(i - 1);
    tasks.saveAll(from);

    // 2) open gap in new column at toIndex
    var to = tasks.findAllByStatusOrderByPositionAsc(toStatus);
    toIndex = Math.max(0, Math.min(toIndex, to.size()));
    for (int i = toIndex; i < to.size(); i++) to.get(i).setPosition(i + 1);
    task.setStatus(toStatus);
    task.setPosition(toIndex);
    tasks.saveAll(to);
    tasks.save(task);

    return ResponseEntity.noContent().build();
  }

  // ---- Edit title/status (simple patch) ----
  @PatchMapping("/{id}")
  @Transactional
  public Task update(@PathVariable long id, @RequestBody Map<String, String> body) {
    var t = tasks.findById(id).orElseThrow();

    if (body.containsKey("title")) t.setTitle(body.get("title"));

    if (body.containsKey("status")) {
      String to = body.get("status");
      if (!Objects.equals(t.getStatus(), to)) {
        // close gap in old column
        var from = tasks.findAllByStatusOrderByPositionAsc(t.getStatus());
        int fromIndex = indexOf(from, id);
        for (int i = fromIndex + 1; i < from.size(); i++) from.get(i).setPosition(i - 1);
        tasks.saveAll(from);

        // append to bottom of new column
        int max = tasks.findAllByStatusOrderByPositionAsc(to)
                       .stream().map(Task::getPosition).max(Integer::compareTo).orElse(-1);
        t.setStatus(to);
        t.setPosition(max + 1);
      }
    }
    return tasks.save(t);
  }

  // ---- Delete (close gap in that column) ----
  @DeleteMapping("/{id}")
  @Transactional
  public ResponseEntity<Void> delete(@PathVariable long id) {
    var t = tasks.findById(id).orElseThrow();

    var list = tasks.findAllByStatusOrderByPositionAsc(t.getStatus());
    int idx = indexOf(list, id);
    for (int i = idx + 1; i < list.size(); i++) list.get(i).setPosition(i - 1);
    tasks.saveAll(list);

    tasks.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  // ---- helpers ----
  private static int indexOf(List<Task> list, long id) {
    for (int i = 0; i < list.size(); i++) if (list.get(i).getId().equals(id)) return i;
    throw new IllegalStateException("Task not in its ordered list");
  }
}
