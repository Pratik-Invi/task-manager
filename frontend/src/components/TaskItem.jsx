import React from 'react';

function formatDate(ts){
  if(!ts) return null;
  try{ return new Date(ts).toLocaleString(); }catch(e){ return ts; }
}

export default function TaskItem({task,onToggle,onDelete}){
  return(<div style={{padding:'8px 0',borderBottom:'1px solid #eee'}}>
    <div style={{display:'flex',alignItems:'center'}}>
      <input type="checkbox" checked={task.done} onChange={()=>onToggle(task.id,!task.done)}/>
      <span style={{marginLeft:8,fontWeight:500}}>{task.title}</span>
      <button style={{marginLeft:8}} onClick={()=>onDelete(task.id)}>Delete</button>
    </div>
    <div style={{fontSize:'0.85em',color:'#666',marginTop:6}}>
      {task.done ? `✅ Completed at ${formatDate(task.completed_at)}` : '⏳ Pending'}
    </div>
  </div>);
}
