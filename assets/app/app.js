var taskApp = angular.module('taskManagerApp', [])
    .controller('TaskListController', ['$http', '$filter', function($http, $filter) {
        var taskList = this;
        
        taskList.avaliableStatuses = [
            {key: 1, name: 'В работе'},
            {key: 2, name: 'Завершена'}
        ];
        
        taskList.avaliablePriorities = [
            {key: 1, name: 'Низкий'},
            {key: 2, name: 'Средний'},
            {key: 3, name: 'Высокий'}
        ];
        
        taskList.statusFilterParam = 0;
        taskList.priorityFilterParam = 0;
        
        taskList.showTags = [];
        taskList.deleteTags = [];
        taskList.tagDuplicate = false;
        
        var req = {
            method: 'GET',
            url: 'http://api.task-manager.ru/Tasks',
            headers: {
                'Content-Type': 'application/json'
            }
        }
        
        $http(req).then(function (response){
            taskList.tasks = response.data;
            taskList.filterSortTasks();
            taskList.showTags = new Array(taskList.tasks.length);
            taskList.showTags.fill(false);
        });
        
        taskList.changeStatus = function(task) {
            var req = {
                method: 'PUT',
                url: 'http://api.task-manager.ru/Tasks/update',
                data: JSON.stringify(task),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            $http(req).then(function (response){
                taskList.filterSortTasks();
            });
        }
        
        taskList.sortTasks = function() {
            taskList.showTags.fill(false);
            var doneTasks = $filter('filter')(taskList.tasks, {status: 2});
            var activeTasks = $filter('filter')(taskList.tasks, {status: 1});
            var sortedActive = activeTasks.sort(function(task1,task2){
                return (task1.priority < task2.priority) ? 1 : -1;
            });
            taskList.tasks = sortedActive.concat(doneTasks);
        }
        
        taskList.filterSortTasks = function() {
            taskList.filterTasks().then(function() {
                taskList.sortTasks();
            });
        }
        
        taskList.filterTasks = function() {
            var req = {
                method: 'POST',
                url: 'http://api.task-manager.ru/Tasks/filter',
                data: JSON.stringify({
                    status: taskList.statusFilterParam,
                    priority: taskList.priorityFilterParam
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        
            return $http(req).then(function (response){
                taskList.tasks = response.data;
                taskList.showTags = new Array(taskList.tasks.length);
                taskList.showTags.fill(false);
            });
        }
        
        taskList.changePriority = function(task, priority) {
            task.priority = String(priority);
            var req = {
                method: 'PUT',
                url: 'http://api.task-manager.ru/Tasks/update',
                data: JSON.stringify(task),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            $http(req).then(function (response){
                taskList.filterSortTasks();
            });
        }
        
        taskList.addTask = function() {
            var taskName = taskList.taskText;
            var newTask = {name:taskName, status: "1", priority: "1", tags:[]};
            var req = {
                method: 'POST',
                url: 'http://api.task-manager.ru/Tasks/add',
                data: JSON.stringify(newTask),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            $http(req).then(function (response) {
                taskList.tasks.push(response.data);
                taskList.filterSortTasks();
            });
            
            taskList.taskText = '';
        };
        
        taskList.addTag = function(task) {
            if (taskList.tagText != '' && taskList.tagText !== undefined){
                if (task.tags.indexOf(taskList.tagText) >= 0) {
                    taskList.tagDuplicate = true;
                } else {
                    task.tags.push(taskList.tagText);
                    var req = {
                        method: 'POST',
                        url: 'http://api.task-manager.ru/Tasks/update',
                        data: JSON.stringify(task),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                    $http(req);
                    taskList.tagText = '';
                }
            }
        }
        
        taskList.toggleTags = function(index) {
            angular.forEach(taskList.showTags, function(st, key){
                if (index == key) {
                    taskList.showTags[index] = !taskList.showTags[index];
                } else {
                    taskList.showTags[key] = false;
                }
            });
            taskList.deleteTags = [];
            taskList.tagDuplicate = false;
        }
        
        taskList.switchDeleteTag = function(tag) {
            var index = taskList.deleteTags.indexOf(tag);
            if (index >= 0) {
                taskList.deleteTags.splice(index, 1);
            } else {
                taskList.deleteTags.push(tag);
            }
        }
        
        taskList.removeTags = function(task) {
            angular.forEach(taskList.deleteTags, function(dt) {
                var index = task.tags.indexOf(dt);
                if (index >= 0) {
                    task.tags.splice(index, 1);
                }
            });
            var req = {
                method: 'POST',
                url: 'http://api.task-manager.ru/Tasks/update',
                data: JSON.stringify(task),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            $http(req);
        taskList.deleteTags = [];
        }
        
        taskList.remaining = function() {
            var count = 0;
            angular.forEach(taskList.tasks, function(task) {
                count += task.status == 2 ? 0 : 1;
            });
            return count;
        };
    }])
    .filter('range', function() {
        return function(input, init, total) {
            total = parseInt(total);
            for (var i=init; i<=total; i++)
                input.push(i);
            return input;
        };
    });