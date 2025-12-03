import React from 'react';
export default function TaskItem({task,onToggle,onDelete}){
  return(<div>
    <input type="checkbox" checked={task.done} onChange={()=>onToggle(task.id,!task.done)}/>
    {task.title}
    <button onClick={()=>onDelete(task.id)}>Delete</button>
  </div>);
}
