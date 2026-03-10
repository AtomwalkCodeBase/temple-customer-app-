// screens/TodoListScreen.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const TodoListScreen = () => {
    const [tasks, setTasks] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Form states
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [recurrenceType, setRecurrenceType] = useState('none'); // none, daily, weekly, monthly
    const [recurrenceCount, setRecurrenceCount] = useState('1');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [enableNotification, setEnableNotification] = useState(true);

    // Load tasks from AsyncStorage on mount
    useEffect(() => {
        loadTasks();
        requestNotificationPermissions();
    }, []);

    // Request notification permissions
    const requestNotificationPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Notifications will not work without permission');
        }
    };

    // Load tasks from storage
    const loadTasks = async () => {
        try {
            const storedTasks = await AsyncStorage.getItem('todo_tasks');
            if (storedTasks) {
                const parsedTasks = JSON.parse(storedTasks);
                // Convert date strings back to Date objects
                const tasksWithDates = parsedTasks.map(task => ({
                    ...task,
                    createdAt: new Date(task.createdAt),
                    scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : null,
                    nextNotificationDate: task.nextNotificationDate ? new Date(task.nextNotificationDate) : null,
                }));
                setTasks(tasksWithDates);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    // Save tasks to storage
    const saveTasks = async (updatedTasks) => {
        try {
            await AsyncStorage.setItem('todo_tasks', JSON.stringify(updatedTasks));
            setTasks(updatedTasks);
        } catch (error) {
            console.error('Error saving tasks:', error);
            Alert.alert('Error', 'Failed to save task');
        }
    };

    // Schedule notification
    const scheduleNotification = async (task, recurrenceIndex = 0) => {
        if (!enableNotification) return null;

        try {
            const notificationDate = new Date(task.scheduledDate);

            // Add recurrence offset
            if (task.recurrenceType === 'daily' && recurrenceIndex > 0) {
                notificationDate.setDate(notificationDate.getDate() + recurrenceIndex);
            } else if (task.recurrenceType === 'weekly' && recurrenceIndex > 0) {
                notificationDate.setDate(notificationDate.getDate() + (recurrenceIndex * 7));
            } else if (task.recurrenceType === 'monthly' && recurrenceIndex > 0) {
                notificationDate.setMonth(notificationDate.getMonth() + recurrenceIndex);
            }

            // Don't schedule if date is in the past
            if (notificationDate < new Date()) return null;

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📋 Task Reminder',
                    body: task.name,
                    data: { taskId: task.id, recurrenceIndex },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    date: notificationDate,
                    channelId: 'default',
                },
            });

            return notificationId;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    };

    // Schedule all recurrences
    const scheduleAllRecurrences = async (task) => {
        const count = parseInt(task.recurrenceCount) || 1;
        const notificationIds = [];

        for (let i = 0; i < count; i++) {
            const id = await scheduleNotification(task, i);
            if (id) notificationIds.push(id);
        }

        return notificationIds;
    };

    // Cancel all notifications for a task
    const cancelTaskNotifications = async (task) => {
        if (task.notificationIds && task.notificationIds.length > 0) {
            for (const id of task.notificationIds) {
                await Notifications.cancelScheduledNotificationAsync(id);
            }
        }
    };

    // Add new task
    const handleAddTask = async () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name');
            return;
        }

        // Combine date and time
        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(
            selectedTime.getHours(),
            selectedTime.getMinutes(),
            0
        );

        const newTask = {
            id: Date.now().toString(),
            name: taskName,
            description: taskDescription,
            recurrenceType,
            recurrenceCount: parseInt(recurrenceCount) || 1,
            scheduledDate: scheduledDateTime,
            createdAt: new Date(),
            completed: false,
            notificationIds: [],
            nextNotificationDate: scheduledDateTime,
        };

        // Schedule notifications
        if (enableNotification) {
            const notificationIds = await scheduleAllRecurrences(newTask);
            newTask.notificationIds = notificationIds;
        }

        const updatedTasks = [newTask, ...tasks];
        await saveTasks(updatedTasks);

        // Reset form
        resetForm();
        setModalVisible(false);

        Alert.alert('Success', 'Task added successfully!');
    };

    // Edit task
    const handleEditTask = async () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name');
            return;
        }

        // Cancel old notifications
        if (selectedTask) {
            await cancelTaskNotifications(selectedTask);
        }

        // Combine date and time
        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(
            selectedTime.getHours(),
            selectedTime.getMinutes(),
            0
        );

        const updatedTask = {
            ...selectedTask,
            name: taskName,
            description: taskDescription,
            recurrenceType,
            recurrenceCount: parseInt(recurrenceCount) || 1,
            scheduledDate: scheduledDateTime,
            notificationIds: [],
        };

        // Schedule new notifications
        if (enableNotification) {
            const notificationIds = await scheduleAllRecurrences(updatedTask);
            updatedTask.notificationIds = notificationIds;
        }

        const updatedTasks = tasks.map(t =>
            t.id === selectedTask.id ? updatedTask : t
        );

        await saveTasks(updatedTasks);

        resetForm();
        setEditModalVisible(false);
        setSelectedTask(null);

        Alert.alert('Success', 'Task updated successfully!');
    };

    // Delete task
    const handleDeleteTask = async (task) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await cancelTaskNotifications(task);
                        const updatedTasks = tasks.filter(t => t.id !== task.id);
                        await saveTasks(updatedTasks);
                    },
                },
            ]
        );
    };

    // Toggle task completion
    const toggleComplete = async (task) => {
        const updatedTasks = tasks.map(t =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        );
        await saveTasks(updatedTasks);
    };

    // Reset form
    const resetForm = () => {
        setTaskName('');
        setTaskDescription('');
        setRecurrenceType('none');
        setRecurrenceCount('1');
        setSelectedDate(new Date());
        setSelectedTime(new Date());
        setEnableNotification(true);
    };

    // Open edit modal
    const openEditModal = (task) => {
        setSelectedTask(task);
        setTaskName(task.name);
        setTaskDescription(task.description || '');
        setRecurrenceType(task.recurrenceType);
        setRecurrenceCount(task.recurrenceCount.toString());
        setSelectedDate(new Date(task.scheduledDate));
        setSelectedTime(new Date(task.scheduledDate));
        setEnableNotification(task.notificationIds.length > 0);
        setEditModalVisible(true);
    };

    // Format date for display
    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get recurrence text
    const getRecurrenceText = (task) => {
        if (task.recurrenceType === 'none') return 'One-time';
        if (task.recurrenceType === 'daily') return `Daily (${task.recurrenceCount}x)`;
        if (task.recurrenceType === 'weekly') return `Weekly (${task.recurrenceCount}x)`;
        if (task.recurrenceType === 'monthly') return `Monthly (${task.recurrenceCount}x)`;
        return '';
    };

    // Render task item
    const renderTask = ({ item }) => {
        const isOverdue = new Date(item.scheduledDate) < new Date() && !item.completed;

        return (
            <Animated.View
                entering={FadeInUp}
                exiting={FadeOutDown}
                style={styles.taskCard}
            >
                <Swipeable
                    renderRightActions={() => (
                        <TouchableOpacity
                            style={styles.deleteSwipe}
                            onPress={() => handleDeleteTask(item)}
                        >
                            <Ionicons name="trash" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                >
                    <TouchableOpacity
                        style={[
                            styles.taskContent,
                            item.completed && styles.taskCompleted,
                            isOverdue && styles.taskOverdue,
                        ]}
                        onPress={() => toggleComplete(item)}
                        onLongPress={() => openEditModal(item)}
                    >
                        <View style={styles.taskHeader}>
                            <View style={styles.taskTitleContainer}>
                                <TouchableOpacity
                                    onPress={() => toggleComplete(item)}
                                    style={styles.checkbox}
                                >
                                    <Ionicons
                                        name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={24}
                                        color={item.completed ? '#4CAF50' : '#999'}
                                    />
                                </TouchableOpacity>
                                <View>
                                    <Text style={[
                                        styles.taskName,
                                        item.completed && styles.taskNameCompleted
                                    ]}>
                                        {item.name}
                                    </Text>
                                    {item.description ? (
                                        <Text style={styles.taskDescription} numberOfLines={2}>
                                            {item.description}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        <View style={styles.taskFooter}>
                            <View style={styles.taskMeta}>
                                <Ionicons name="time-outline" size={14} color="#666" />
                                <Text style={styles.metaText}>
                                    {formatDate(new Date(item.scheduledDate))}
                                </Text>
                            </View>

                            {item.recurrenceType !== 'none' && (
                                <View style={styles.recurrenceBadge}>
                                    <Ionicons name="repeat" size={12} color="#E88F14" />
                                    <Text style={styles.recurrenceText}>
                                        {getRecurrenceText(item)}
                                    </Text>
                                </View>
                            )}

                            {item.notificationIds.length > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Ionicons name="notifications" size={12} color="#4CAF50" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </Swipeable>
            </Animated.View>
        );
    };

    // Add Task Modal
    const AddTaskModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
                resetForm();
                setModalVisible(false);
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <LinearGradient
                        colors={['#E88F14', '#F44336']}
                        style={styles.modalHeader}
                    >
                        <Text style={styles.modalTitle}>Add New Task</Text>
                        <TouchableOpacity
                            onPress={() => {
                                resetForm();
                                setModalVisible(false);
                            }}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <ScrollView style={styles.modalBody}>
                        {/* Task Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Task Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={taskName}
                                onChangeText={setTaskName}
                                placeholder="Enter task name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                placeholder="Enter task description"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Date & Time */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Schedule Date & Time</Text>
                            <View style={styles.dateTimeContainer}>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar" size={20} color="#E88F14" />
                                    <Text style={styles.dateTimeText}>
                                        {selectedDate.toLocaleDateString('en-IN')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time" size={20} color="#E88F14" />
                                    <Text style={styles.dateTimeText}>
                                        {selectedTime.toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Recurrence Type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Recurrence</Text>
                            <View style={styles.recurrenceOptions}>
                                {['none', 'daily', 'weekly', 'monthly'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.recurrenceOption,
                                            recurrenceType === type && styles.recurrenceOptionSelected,
                                        ]}
                                        onPress={() => setRecurrenceType(type)}
                                    >
                                        <Text style={[
                                            styles.recurrenceOptionText,
                                            recurrenceType === type && styles.recurrenceOptionTextSelected,
                                        ]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Recurrence Count */}
                        {recurrenceType !== 'none' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Number of Recurrences</Text>
                                <View style={styles.countContainer}>
                                    <TouchableOpacity
                                        style={styles.countButton}
                                        onPress={() => {
                                            const val = parseInt(recurrenceCount) || 1;
                                            if (val > 1) setRecurrenceCount((val - 1).toString());
                                        }}
                                    >
                                        <Ionicons name="remove" size={20} color="#E88F14" />
                                    </TouchableOpacity>

                                    <TextInput
                                        style={styles.countInput}
                                        value={recurrenceCount}
                                        onChangeText={setRecurrenceCount}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />

                                    <TouchableOpacity
                                        style={styles.countButton}
                                        onPress={() => {
                                            const val = parseInt(recurrenceCount) || 1;
                                            if (val < 30) setRecurrenceCount((val + 1).toString());
                                        }}
                                    >
                                        <Ionicons name="add" size={20} color="#E88F14" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Notification Toggle */}
                        <View style={styles.inputGroup}>
                            <View style={styles.switchContainer}>
                                <Text style={styles.label}>Enable Notifications</Text>
                                <Switch
                                    value={enableNotification}
                                    onValueChange={setEnableNotification}
                                    trackColor={{ false: '#ddd', true: '#E88F14' }}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddTask}
                        >
                            <LinearGradient
                                colors={['#E88F14', '#F44336']}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>Create Task</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Edit Task Modal
    const EditTaskModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => {
                resetForm();
                setEditModalVisible(false);
                setSelectedTask(null);
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <LinearGradient
                        colors={['#4CAF50', '#45A049']}
                        style={styles.modalHeader}
                    >
                        <Text style={styles.modalTitle}>Edit Task</Text>
                        <TouchableOpacity
                            onPress={() => {
                                resetForm();
                                setEditModalVisible(false);
                                setSelectedTask(null);
                            }}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <ScrollView style={styles.modalBody}>
                        {/* Same form fields as Add Modal */}
                        {/* Task Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Task Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={taskName}
                                onChangeText={setTaskName}
                                placeholder="Enter task name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                placeholder="Enter task description"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Date & Time */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Schedule Date & Time</Text>
                            <View style={styles.dateTimeContainer}>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar" size={20} color="#4CAF50" />
                                    <Text style={styles.dateTimeText}>
                                        {selectedDate.toLocaleDateString('en-IN')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time" size={20} color="#4CAF50" />
                                    <Text style={styles.dateTimeText}>
                                        {selectedTime.toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Recurrence Type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Recurrence</Text>
                            <View style={styles.recurrenceOptions}>
                                {['none', 'daily', 'weekly', 'monthly'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.recurrenceOption,
                                            recurrenceType === type && styles.recurrenceOptionSelectedEdit,
                                        ]}
                                        onPress={() => setRecurrenceType(type)}
                                    >
                                        <Text style={[
                                            styles.recurrenceOptionText,
                                            recurrenceType === type && styles.recurrenceOptionTextSelected,
                                        ]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Recurrence Count */}
                        {recurrenceType !== 'none' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Number of Recurrences</Text>
                                <View style={styles.countContainer}>
                                    <TouchableOpacity
                                        style={styles.countButton}
                                        onPress={() => {
                                            const val = parseInt(recurrenceCount) || 1;
                                            if (val > 1) setRecurrenceCount((val - 1).toString());
                                        }}
                                    >
                                        <Ionicons name="remove" size={20} color="#4CAF50" />
                                    </TouchableOpacity>

                                    <TextInput
                                        style={styles.countInput}
                                        value={recurrenceCount}
                                        onChangeText={setRecurrenceCount}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />

                                    <TouchableOpacity
                                        style={styles.countButton}
                                        onPress={() => {
                                            const val = parseInt(recurrenceCount) || 1;
                                            if (val < 30) setRecurrenceCount((val + 1).toString());
                                        }}
                                    >
                                        <Ionicons name="add" size={20} color="#4CAF50" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Notification Toggle */}
                        <View style={styles.inputGroup}>
                            <View style={styles.switchContainer}>
                                <Text style={styles.label}>Enable Notifications</Text>
                                <Switch
                                    value={enableNotification}
                                    onValueChange={setEnableNotification}
                                    trackColor={{ false: '#ddd', true: '#4CAF50' }}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleEditTask}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45A049']}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>Update Task</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#E88F14', '#F44336']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Task Manager</Text>
                        <Text style={styles.headerSubtitle}>
                            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} •{' '}
                            {tasks.filter(t => !t.completed).length} pending
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Task List */}
            {tasks.length > 0 ? (
                <FlatList
                    data={tasks}
                    renderItem={renderTask}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkbox-outline" size={80} color="#ddd" />
                    <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                    <Text style={styles.emptyText}>
                        Tap the + button to create your first task with reminders
                    </Text>
                </View>
            )}

            {/* Date Pickers */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setSelectedDate(date);
                    }}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="default"
                    onChange={(event, time) => {
                        setShowTimePicker(false);
                        if (time) setSelectedTime(time);
                    }}
                />
            )}

            {/* Modals */}
            <AddTaskModal />
            <EditTaskModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    listContainer: {
        padding: 20,
        gap: 12,
    },
    taskCard: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    taskContent: {
        backgroundColor: '#fff',
        padding: 16,
    },
    taskCompleted: {
        opacity: 0.7,
        backgroundColor: '#F8F9FA',
    },
    taskOverdue: {
        borderLeftWidth: 4,
        borderLeftColor: '#F44336',
    },
    taskHeader: {
        marginBottom: 8,
    },
    taskTitleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    checkbox: {
        marginTop: 2,
    },
    taskName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    taskNameCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    taskDescription: {
        fontSize: 14,
        color: '#666',
        maxWidth: '90%',
    },
    taskFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginLeft: 36,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    recurrenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
    },
    recurrenceText: {
        fontSize: 10,
        color: '#E88F14',
        fontWeight: '500',
    },
    notificationBadge: {
        backgroundColor: '#E8F5E9',
        padding: 2,
        borderRadius: 10,
    },
    deleteSwipe: {
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        lineHeight: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalBody: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
    },
    dateTimeText: {
        fontSize: 14,
        color: '#333',
    },
    recurrenceOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    recurrenceOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    recurrenceOptionSelected: {
        backgroundColor: '#E88F14',
        borderColor: '#E88F14',
    },
    recurrenceOptionSelectedEdit: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    recurrenceOptionText: {
        fontSize: 14,
        color: '#666',
    },
    recurrenceOptionTextSelected: {
        color: '#fff',
    },
    countContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    countButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countInput: {
        width: 60,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 30,
    },
    submitGradient: {
        padding: 16,
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default TodoListScreen;