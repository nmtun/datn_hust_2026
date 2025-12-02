import sequelize from "../config/dbsetup.js";
import { DataTypes } from "sequelize";

const QuestionToQuiz = sequelize.define("Question_To_Quiz", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quiz_Questions",
            key: "question_id",
        },
    },
    quiz_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Quizzes",
            key: "quiz_id",
        },
    },
    tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Tags",
            key: "tag_id",
        },
        comment: "Tag liên kết câu hỏi với quiz"
    },
    question_order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: "Thứ tự câu hỏi trong quiz"
    },
    points_override: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Điểm số ghi đè cho câu hỏi này trong quiz cụ thể"
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Trạng thái kích hoạt câu hỏi trong quiz"
    },
    added_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Thời gian thêm câu hỏi vào quiz"
    },
    added_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Users",
            key: "user_id",
        },
        comment: "Người thêm câu hỏi vào quiz"
    }
}, {
    tableName: "Question_To_Quiz",
    timestamps: false,
    underscored: true,
    indexes: [
        {
            // Đảm bảo một câu hỏi không bị trùng lặp trong cùng một quiz
            unique: true,
            fields: ['question_id', 'quiz_id'],
            name: 'unique_question_quiz'
        },
        {
            // Index để tìm kiếm nhanh các câu hỏi theo tag và quiz
            fields: ['tag_id', 'quiz_id'],
            name: 'idx_tag_quiz'
        },
        {
            // Index để sắp xếp câu hỏi theo thứ tự trong quiz
            fields: ['quiz_id', 'question_order'],
            name: 'idx_quiz_order'
        },
        {
            // Index để tìm kiếm câu hỏi active
            fields: ['is_active'],
            name: 'idx_active'
        }
    ]
});

// Định nghĩa các phương thức static hữu ích
QuestionToQuiz.findQuestionsByQuizAndTag = async function(quizId, tagId) {
    return await this.findAll({
        where: {
            quiz_id: quizId,
            tag_id: tagId,
            is_active: true
        },
        order: [['question_order', 'ASC']]
    });
};

QuestionToQuiz.findQuizzesByQuestionAndTag = async function(questionId, tagId) {
    return await this.findAll({
        where: {
            question_id: questionId,
            tag_id: tagId,
            is_active: true
        }
    });
};

QuestionToQuiz.addQuestionToQuizByTag = async function(questionId, quizId, tagId, options = {}) {
    const { 
        questionOrder = null, 
        pointsOverride = null, 
        addedBy = null 
    } = options;
    
    return await this.create({
        question_id: questionId,
        quiz_id: quizId,
        tag_id: tagId,
        question_order: questionOrder,
        points_override: pointsOverride,
        added_by: addedBy
    });
};

QuestionToQuiz.removeQuestionFromQuiz = async function(questionId, quizId) {
    return await this.update(
        { is_active: false },
        {
            where: {
                question_id: questionId,
                quiz_id: quizId
            }
        }
    );
};

QuestionToQuiz.reorderQuestionsInQuiz = async function(quizId, questionOrderArray) {
    const updates = questionOrderArray.map((item, index) => {
        return this.update(
            { question_order: index + 1 },
            {
                where: {
                    question_id: item.questionId,
                    quiz_id: quizId,
                    is_active: true
                }
            }
        );
    });
    
    return await Promise.all(updates);
};

export default QuestionToQuiz;
