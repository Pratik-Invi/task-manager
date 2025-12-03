import React from 'react';
import TaskItem from './TaskItem';
export default function TaskList({tasks,onToggle,onDelete}){
  return tasks.map(t=><TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete}/>);
}
