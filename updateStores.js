const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'stores');

const stores = [
  { file: 'taskStore.ts', type: 'task' },
  { file: 'noteStore.ts', type: 'note' },
  { file: 'projectStore.ts', type: 'project' },
  { file: 'reminderStore.ts', type: 'reminder' },
  { file: 'alarmStore.ts', type: 'alarm' },
  { file: 'goalStore.ts', type: 'goal' },
  { file: 'contactStore.ts', type: 'contact' },
  { file: 'calendarStore.ts', type: 'calendar' }
];

for (const { file, type } of stores) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - does not exist.`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if not exists
  if (!content.includes("import { syncQueue }")) {
    content = "import { syncQueue } from '../services/syncQueue';\n" + content;
  }

  // Find and replace catch blocks for create
  // create pattern: const created = await tasksApi.create(newTask); ... } catch {
  content = content.replace(/try {\s*const created = await \w+Api\.create\(([^)]+)\);\s*if \(created && created\.id\) {[^}]*}[^}]*}\s*catch\s*(?:\([^)]+\))?\s*{[^}]*}/g, (match, newObj) => {
    return match.replace(/catch\s*(?:\([^)]+\))?\s*{[^}]*}/, `catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: '${type}',
          action: 'create',
          entityId: ${newObj}.id,
          payload: ${newObj}
        });
      }
    }`);
  });

  // Find and replace catch blocks for update/patch
  // update pattern: await tasksApi.update(id, updates); ... } catch {
  // Also works for toggle, addSubtask etc where update is called
  content = content.replace(/try {\s*await \w+Api\.(?:update|patch|post)\(([^,]+),\s*([^)]+)\);\s*} catch\s*(?:\([^)]+\))?\s*{[^}]*}/g, (match, idVar, payloadVar) => {
    return match.replace(/catch\s*(?:\([^)]+\))?\s*{[^}]*}/, `catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: '${type}',
          action: 'update',
          entityId: ${idVar},
          payload: ${payloadVar}
        });
      }
    }`);
  });
  
  // Find and replace catch blocks for delete
  // delete pattern: await tasksApi.delete(id); ... } catch {
  content = content.replace(/try {\s*await \w+Api\.delete\(([^)]+)\);\s*} catch\s*(?:\([^)]+\))?\s*{[^}]*}/g, (match, idVar) => {
    return match.replace(/catch\s*(?:\([^)]+\))?\s*{[^}]*}/, `catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: '${type}',
          action: 'delete',
          entityId: ${idVar},
          payload: undefined
        });
      }
    }`);
  });

  // Additional check for methods that might not have a try-catch for API call or might have an inline catch
  // E.g. tasksApi.update(taskId, { subtasks: targetSubtasks } as any).catch(() => {});
  content = content.replace(/\w+Api\.(?:update|patch)\(([^,]+),\s*([^)]+)\)\.catch\(\(\)\s*=>\s*{}\);/g, (match, idVar, payloadVar) => {
    return `
    ${match.split('.catch')[0]}.catch((err: any) => {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: '${type}',
          action: 'update',
          entityId: ${idVar},
          payload: ${payloadVar}
        });
      }
    });
    `.trim();
  });

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Stores updated successfully.');
