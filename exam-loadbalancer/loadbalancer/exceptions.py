class ExamLBError(Exception):
    pass

class PodAtCapacity(ExamLBError):
    pass

class PodNotFound(ExamLBError):
    pass

class SessionNotFound(ExamLBError):
    pass

class TestNotRegistered(ExamLBError):
    pass

class FlyMachineError(ExamLBError):
    pass
